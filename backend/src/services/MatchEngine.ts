import { txLineClient, TxFixture } from '../txline/TxLineClient';
import { MatchState, MatchStatus } from '../types';
import { MatchNormalizer } from './MatchNormalizer';
import { AIService } from '../ai/AIService';
import { socketService } from '../sockets/SocketService';
import { logger } from '../utils/logger';
import { env, hasTxLineCredentials } from '../config/env';

/**
 * Known finished fixture IDs to bootstrap directly (they drop off the snapshot).
 * Only used when TXLINE_WC_COMPETITION_ID is set (i.e. mainnet WC mode).
 */
const KNOWN_WC_FINISHED_FIXTURES: Array<{
  FixtureId: number;
  Participant1: string;
  Participant2: string;
  StartTime: number;
  Participant1IsHome: boolean;
}> = [
  // England vs Argentina — Semifinal — Jul 15 2026
  // Final score: England 1 – 2 Argentina (Stats key 1=1, key 2=2)
  { FixtureId: 18241006, Participant1: 'England', Participant2: 'Argentina', StartTime: 1784142000000, Participant1IsHome: true },
  // FIFA World Cup 2026 Final — Jul 19 2026
  // StartTime: 2026-07-19T20:00:00Z = 1784527200000
  { FixtureId: 18241010, Participant1: 'France', Participant2: 'Spain', StartTime: 1784527200000, Participant1IsHome: true },
];
const LIVE_STATUSES: MatchStatus[] = [
  'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'EXTRA_TIME', 'PENALTIES',
];

const FINISHED_STATUSES: MatchStatus[] = ['FINISHED'];

export class MatchEngine {
  private matches: Map<string, MatchState> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private livePollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private historicalBootstrapped = false;
  private aiGeneratedFor: Set<string> = new Set();
  private finishedAiDone: Set<string> = new Set();
  // Track last known Seq per fixture so we can use /updates efficiently
  private lastSeq: Map<string, number> = new Map();

  startPolling() {
    if (this.isPolling) return;
    if (!hasTxLineCredentials()) {
      logger.warn('TxLINE credentials are missing — MatchEngine polling is disabled until TXLINE_JWT and TXLINE_API_KEY are configured.');
      return;
    }
    this.isPolling = true;
    logger.info('Started polling MatchEngine');

    this.bootstrapHistorical()
      .then(() => {
        logger.info(`Bootstrap complete — ${this.getRecentMatches().length} recent matches in memory`);
        return this.tick();
      })
      .catch((e) => logger.error('Initial bootstrap/tick failed', { error: e.message }));

    // Full fixture snapshot poll every 30s (discovers new matches, phase changes)
    this.pollingInterval = setInterval(() => this.tick(), 30_000);

    // Fast live-match-only poll every 10s for score/event updates
    this.livePollingInterval = setInterval(() => this.tickLive(), 10_000);
  }

  stopPolling() {
    this.isPolling = false;
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.livePollingInterval) clearInterval(this.livePollingInterval);
    logger.info('Stopped polling MatchEngine');
  }

  getMatch(id: string): MatchState | undefined {
    return this.matches.get(id);
  }

  getAllMatches(): MatchState[] {
    return Array.from(this.matches.values());
  }

  getLiveMatches(): MatchState[] {
    return this.getAllMatches().filter((m) => LIVE_STATUSES.includes(m.status));
  }

  getUpcomingMatches(): MatchState[] {
    return this.getAllMatches().filter((m) => m.status === 'NOT_STARTED');
  }

  getRecentMatches(): MatchState[] {
    return this.getAllMatches()
      .filter((m) => FINISHED_STATUSES.includes(m.status))
      .sort((a, b) => this.kickoffMs(b) - this.kickoffMs(a));
  }

  private kickoffMs(m: MatchState): number {
    const t = m.kickoffTime;
    const ms = typeof t === 'number' ? t : new Date(t).getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  private getWcCompetitionId(): number | undefined {
    if (!env.TXLINE_WC_COMPETITION_ID) return undefined;
    const id = parseInt(env.TXLINE_WC_COMPETITION_ID, 10);
    return Number.isFinite(id) ? id : undefined;
  }

  private isWorldCupFixture(fixture: TxFixture): boolean {
    const wcId = this.getWcCompetitionId();

    // If an explicit competition ID is set, match on that OR on name/window
    // (don't use it as an exclusive filter — TxLINE sometimes mismatches CompetitionId)
    const matchesId = wcId !== undefined && fixture.CompetitionId === wcId;

    // Name filter — catches variations like "FIFA World Cup 2026", "World Cup 2026", etc.
    const isWcName = (fixture.Competition ?? '').toLowerCase().includes('world cup');

    // Date window filter — WC 2026: June 11 – July 19, 2026 (with buffer either side)
    const WC_START = new Date('2026-06-01').getTime();
    const WC_END   = new Date('2026-07-31').getTime();
    const startMs  = typeof fixture.StartTime === 'number'
      ? fixture.StartTime
      : new Date(fixture.StartTime ?? '').getTime();
    const isInWindow = Number.isFinite(startMs) && startMs >= WC_START && startMs <= WC_END;

    // Accept if any signal matches — don't require all three
    return matchesId || isWcName || isInWindow;
  }

  private filterWorldCup(fixtures: TxFixture[]): TxFixture[] {
    return fixtures.filter((f) => this.isWorldCupFixture(f));
  }

  private async bootstrapHistorical() {
    if (this.historicalBootstrapped) return;
    this.historicalBootstrapped = true;

    const wcId = this.getWcCompetitionId();

    try {
      // 1. Load snapshot fixtures (upcoming + live)
      let snapshot = await txLineClient.getFixtures(wcId);
      let wcAll = this.filterWorldCup(snapshot);

      // If competitionId filter returned nothing useful, retry without
      if (wcAll.length < 1 && wcId !== undefined) {
        snapshot = await txLineClient.getFixtures();
        wcAll = this.filterWorldCup(snapshot);
      }

      const finished = wcAll.filter((f) => [5, 10, 13].includes(Number(f.GameState)));
      const live     = wcAll.filter((f) => [2,3,4,7,8,9,11,12].includes(Number(f.GameState)));
      const upcoming = wcAll.filter((f) => f.GameState === 1);
      // GameState null/undefined = ambiguous — TxLINE sometimes sends null for live matches
      // or genuinely finished ones.  Sync them via snapshot so events can resolve the real status.
      const ambiguous = wcAll.filter((f) => f.GameState === null || f.GameState === undefined);

      logger.info(
        `Snapshot: ${wcAll.length} WC fixtures — ${finished.length} finished, ${live.length} live, ${upcoming.length} upcoming, ${ambiguous.length} ambiguous (null GameState)`
      );

      await Promise.allSettled([
        ...finished.map((f) => this.syncFixture(f)),
        ...live.map((f) => this.syncFixture(f)),
        ...upcoming.map((f) => this.syncFixture(f)),
        ...ambiguous.map((f) => this.syncFixture(f)),
      ]);

      // 2. Bootstrap historical fixtures that dropped off the snapshot.
      // Two strategies run in parallel:
      //   a) Date-range query on /api/fixtures (discovers ALL past WC fixtures automatically)
      //   b) TXLINE_KNOWN_FIXTURE_IDS env var + KNOWN_WC_FINISHED_FIXTURES (manual fallback)
      await this.bootstrapAllHistorical(wcId);

    } catch (err: any) {
      logger.error('Historical bootstrap failed', { error: err.message });
    }
  }

  /**
   * Discover all historical WC fixtures via two approaches, run concurrently:
   *   1. /api/fixtures date-range query (WC 2026: Jun 11 – Jul 19)
   *   2. Hardcoded KNOWN_WC_FINISHED_FIXTURES + TXLINE_KNOWN_FIXTURE_IDS env var
   *
   * Both approaches use scores/snapshot to fetch events — the status is derived
   * from the events, not from fixture-level GameState.
   */
  private async bootstrapAllHistorical(wcId?: number) {
    // --- Strategy 1: date-range discovery via /api/fixtures ---
    try {
      const historical = await txLineClient.getFixturesByDateRange(
        wcId,
        '2026-06-11T00:00:00Z',
        '2026-07-20T23:59:59Z',
      );
      const wcHistorical = this.filterWorldCup(historical);
      // Only process fixtures not already in memory
      const novel = wcHistorical.filter((f) => !this.matches.has(String(f.FixtureId)));

      if (novel.length > 0) {
        logger.info(`Date-range discovery: found ${novel.length} historical WC fixture(s) to bootstrap`);
        await Promise.allSettled(novel.map((f) => this.syncFixture(f)));
      } else if (wcHistorical.length > 0) {
        logger.info(`Date-range discovery: all ${wcHistorical.length} historical fixture(s) already in memory`);
      } else {
        logger.info('Date-range discovery: /api/fixtures returned no WC fixtures (may not be available on this tier)');
      }
    } catch (err: any) {
      logger.warn('Date-range fixture discovery failed — falling back to known IDs', { error: err.message });
    }

    // --- Strategy 2: known fixture IDs (env var + hardcoded list) ---
    await this.bootstrapKnownFinished();
  }

  /**
   * Bootstrap known finished fixtures that dropped off the snapshot.
   * Sources (merged, deduped):
   *   1. TXLINE_KNOWN_FIXTURE_IDS env var — comma-separated fixture IDs
   *   2. KNOWN_WC_FINISHED_FIXTURES — hardcoded list with team metadata
   *
   * Fixture IDs from the env var don't have team names, so we fetch the fixture
   * from the snapshot first; if not found we synthesize a minimal fixture and let
   * the events drive everything (team names come from the events' Participant fields
   * or remain as placeholder "TBD" until we can do a full fixture lookup).
   */
  private async bootstrapKnownFinished() {
    // Merge env var IDs with the hardcoded list
    const envIds = (env.TXLINE_KNOWN_FIXTURE_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);

    // Build a map from the hardcoded list for quick metadata lookup
    const metaById = new Map(KNOWN_WC_FINISHED_FIXTURES.map((f) => [f.FixtureId, f]));

    // Merge: env var IDs first, then hardcoded (env var takes priority if both present)
    const allIds = Array.from(new Set([...envIds, ...KNOWN_WC_FINISHED_FIXTURES.map((f) => f.FixtureId)]));

    if (allIds.length === 0) return;

    logger.info(`Bootstrapping ${allIds.length} known/configured finished fixture(s)`);

    await Promise.allSettled(
      allIds.map(async (fixtureId) => {
        const id = String(fixtureId);
        if (this.matches.has(id)) return; // already loaded

        const meta = metaById.get(fixtureId);

        try {
          const events = await txLineClient.getScoresSnapshot(fixtureId);
          if (!events.length) {
            logger.warn(`No events returned for fixture ${id} — skipping`);
            return;
          }

          // Build a fixture stub. Prefer metadata from the hardcoded list;
          // fall back to deriving team names from the first event's FixtureId context.
          const fixture: TxFixture = {
            FixtureId: fixtureId,
            StartTime: meta?.StartTime ?? 0,
            Competition: 'FIFA World Cup 2026',
            CompetitionId: 72,
            Participant1: meta?.Participant1 ?? 'Team 1',
            Participant2: meta?.Participant2 ?? 'Team 2',
            Participant1IsHome: meta?.Participant1IsHome ?? true,
            GameState: null, // let events drive — they'll show game_finalised (StatusId=100)
          };

          const state = MatchNormalizer.normalize(fixture, events);
          state.winProbability = AIService.calculateWinProbability(state);
          this.matches.set(id, state);
          logger.info(`Bootstrapped fixture ${id} (${fixture.Participant1} vs ${fixture.Participant2}) — status: ${state.status} score: ${state.score.home}-${state.score.away}`);
          this.generateFinishedMatchAI(state).catch(() => {});
        } catch (err: any) {
          logger.error(`Failed to bootstrap fixture ${id}`, { error: err.message });
        }
      })
    );
  }

  private async tick() {
    try {
      const wcId = this.getWcCompetitionId();
      const fixtures = await txLineClient.getFixtures(wcId);
      const worldCupFixtures = this.filterWorldCup(fixtures);

      logger.info(
        `Fetched ${fixtures.length} fixtures from TxLINE (${worldCupFixtures.length} World Cup)`
      );

      // Any newly-discovered finished fixture that isn't in our map yet must be synced
      // (the snapshot omits GameState for finished matches — treating undefined as FINISHED)
      await Promise.allSettled(
        worldCupFixtures.map((fixture) => this.syncFixture(fixture))
      );
    } catch (err: any) {
      logger.error('MatchEngine tick failed', { error: err.message });
    }
  }

  /**
   * Fast poll for live matches only — uses /api/scores/snapshot for the
   * full event log, then diffs against what we have to find new events.
   * Called every 10 seconds (vs 30s for the full fixture poll).
   */
  private async tickLive() {
    const liveMatches = this.getLiveMatches();
    if (liveMatches.length === 0) return;

    logger.info(`Fast live poll for ${liveMatches.length} live match(es)`);

    await Promise.allSettled(
      liveMatches.map(async (m) => {
        const fixtureId = parseInt(m.id, 10);
        if (!Number.isFinite(fixtureId)) return;
        try {
          // Use /scores/snapshot which always returns full current state
          const events = await txLineClient.getScoresSnapshot(fixtureId);
          if (!events.length) return;

          // Build a lightweight fixture object from what we already know
          const fakeFixture: import('../txline/TxLineClient').TxFixture = {
            FixtureId: fixtureId,
            StartTime: m.kickoffTime,
            Competition: m.competition,
            CompetitionId: 72,
            Participant1: m.homeTeam,
            Participant2: m.awayTeam,
            Participant1IsHome: true,
            GameState: null, // let events drive the status
          };

          const prev = this.matches.get(m.id)!;
          const next = MatchNormalizer.normalize(fakeFixture, events);
          next.winProbability = AIService.calculateWinProbability(next);
          // Preserve AI-generated fields
          next.pulse = next.pulse || prev.pulse;
          next.recap = next.recap || prev.recap;
          next.turningPoints = next.turningPoints || prev.turningPoints;

          this.matches.set(m.id, next);
          this.broadcastDiffs(prev, next);

          if (LIVE_STATUSES.includes(next.status)) {
            await this.maybeGenerateAI(next, prev);
          }

          if (!FINISHED_STATUSES.includes(prev.status) && FINISHED_STATUSES.includes(next.status)) {
            await this.generateFinishedMatchAI(next);
          }
        } catch (err: any) {
          logger.error(`Fast live poll failed for ${m.id}`, { error: err.message });
        }
      })
    );
  }

  private async syncFixture(fixture: TxFixture) {
    const id = String(fixture.FixtureId);

    if (!this.isWorldCupFixture(fixture)) return;

    try {
      const prevStatus = this.matches.get(id)?.status;
      const isKnownFinished = prevStatus && FINISHED_STATUSES.includes(prevStatus);

      if (isKnownFinished) {
        if (!this.finishedAiDone.has(id)) {
          const match = this.matches.get(id)!;
          await this.generateFinishedMatchAI(match);
        }
        return;
      }

      const fixtureIsFinished = MatchNormalizer.isFixtureFinished(fixture.GameState);

      let events: import('../txline/TxLineClient').TxScoreEvent[] = [];
      try {
        // Always try scores/snapshot first — it's the most complete source.
        // Only fall back to historical if snapshot returns nothing AND the fixture
        // is confirmed finished (GameState 5/10/13).
        events = await txLineClient.getScoresSnapshot(fixture.FixtureId);
        if (!events.length && fixtureIsFinished) {
          events = await txLineClient.getHistoricalScores(fixture.FixtureId);
        }
      } catch {
        // snapshot failed — try historical as last resort for finished fixtures
        if (fixtureIsFinished) {
          try {
            events = await txLineClient.getHistoricalScores(fixture.FixtureId);
          } catch {
            events = [];
          }
        }
      }

      const prev = this.matches.get(id);
      const next = MatchNormalizer.normalize(fixture, events);
      next.winProbability = AIService.calculateWinProbability(next);

      this.matches.set(id, next);

      if (!prev) {
        if (FINISHED_STATUSES.includes(next.status)) {
          this.generateFinishedMatchAI(next).catch(() => {});
        } else if (LIVE_STATUSES.includes(next.status)) {
          // First time we see a live match — generate an initial pulse immediately
          this.generateInitialPulse(next).catch(() => {});
        }
        return;
      }

      this.broadcastDiffs(prev, next);

      if (LIVE_STATUSES.includes(next.status)) {
        await this.maybeGenerateAI(next, prev);
      }

      if (!FINISHED_STATUSES.includes(prev.status) && FINISHED_STATUSES.includes(next.status)) {
        await this.generateFinishedMatchAI(next);
      }
    } catch (err: any) {
      logger.error(`Failed to sync fixture ${id}`, { error: err.message });
    }
  }

  private broadcastDiffs(prev: MatchState, next: MatchState) {
    const id = next.id;

    // Score / minute changed
    if (
      prev.score.home !== next.score.home ||
      prev.score.away !== next.score.away ||
      prev.minute !== next.minute
    ) {
      socketService.broadcast('scoreUpdated', {
        matchId: id,
        homeScore: next.score.home,
        awayScore: next.score.away,
        minute: next.minute,
      });
    }

    // Stats changed
    if (JSON.stringify(prev.stats) !== JSON.stringify(next.stats)) {
      socketService.broadcast('statsUpdated', { matchId: id, stats: this.mapStats(next) });
    }

    // New timeline events
    const prevIds = new Set(prev.timeline.map((e) => e.id));
    const newEvents = next.timeline.filter((e) => !prevIds.has(e.id));
    for (const event of newEvents) {
      socketService.broadcast('timelineUpdated', { matchId: id, event });
    }

    // Momentum changed
    if (prev.momentum.score !== next.momentum.score) {
      socketService.broadcast('momentumUpdated', { matchId: id, momentum: next.momentum.score });
    }

    // Win probability changed
    if (JSON.stringify(prev.winProbability) !== JSON.stringify(next.winProbability)) {
      socketService.broadcast('winProbabilityUpdated', {
        matchId: id,
        winProbability: [
          next.winProbability!.home,
          next.winProbability!.draw,
          next.winProbability!.away,
        ],
      });
    }

    // Match finished
    if (!FINISHED_STATUSES.includes(prev.status) && FINISHED_STATUSES.includes(next.status)) {
      socketService.broadcast('matchFinished', {
        matchId: id,
        homeScore: next.score.home,
        awayScore: next.score.away,
        turningPoints: next.turningPoints ?? [],
      });
    }
  }

  private async maybeGenerateAI(match: MatchState, prev: MatchState) {
    const scoreChanged =
      prev.score.home !== match.score.home || prev.score.away !== match.score.away;
    const periodicUpdate = match.minute > 0 && match.minute % 5 === 0;
    const noPulseYet = !match.pulse;
    const key = `${match.id}-${match.minute}`;

    if (!scoreChanged && !periodicUpdate && !noPulseYet) return;
    if (this.aiGeneratedFor.has(key)) return;
    this.aiGeneratedFor.add(key);

    try {
      const [pulse, recap] = await Promise.all([
        AIService.generateMatchPulse(match),
        AIService.generateMatchRecap(match),
      ]);

      if (pulse) {
        match.pulse = pulse;
        match.recap = recap;
        this.matches.set(match.id, match);

        socketService.broadcast('matchPulseUpdated', {
          matchId: match.id,
          pulse: pulse.split('\n\n').map(p => p.trim()).filter(Boolean),
          headline: pulse.split('\n')[0]?.split('. ')[0] ?? pulse,
        });
      }
    } catch (err: any) {
      logger.error(`Live AI generation failed for ${match.id}`, { error: err.message });
    }
  }

  /**
   * Generate the very first pulse for a newly-discovered live match.
   * Runs once in the background without blocking bootstrap.
   */
  private async generateInitialPulse(match: MatchState) {
    const key = `${match.id}-initial`;
    if (this.aiGeneratedFor.has(key)) return;
    this.aiGeneratedFor.add(key);

    try {
      const [pulse, recap] = await Promise.all([
        AIService.generateMatchPulse(match),
        AIService.generateMatchRecap(match),
      ]);

      if (pulse) {
        match.pulse = pulse;
        match.recap = recap;
        this.matches.set(match.id, match);
        logger.info(`Initial pulse generated for live match ${match.id}`);

        socketService.broadcast('matchPulseUpdated', {
          matchId: match.id,
          pulse: pulse.split('\n\n').map(p => p.trim()).filter(Boolean),
          headline: pulse.split('\n')[0]?.split('. ')[0] ?? pulse,
        });
      }
    } catch (err: any) {
      logger.error(`Initial pulse generation failed for ${match.id}`, { error: err.message });
    }
  }

  private async generateFinishedMatchAI(match: MatchState) {
    if (this.finishedAiDone.has(match.id)) return;
    this.finishedAiDone.add(match.id);

    try {
      const [pulse, recap, turningPoints] = await Promise.all([
        AIService.generateMatchPulse(match),
        AIService.generateMatchRecap(match),
        AIService.generateTurningPoints(match),
      ]);

      match.pulse = pulse || match.pulse;
      match.recap = recap || match.recap;
      match.turningPoints = turningPoints.length > 0 ? turningPoints : match.turningPoints;
      this.matches.set(match.id, match);

      logger.info(`Finished match AI done for ${match.id}: ${turningPoints.length} turning points`);
    } catch (err: any) {
      logger.error(`Finished AI generation failed for ${match.id}`, { error: err.message });
    }
  }

  mapStats(m: MatchState) {
    return {
      possession:     [m.stats.possession.home,     m.stats.possession.away],
      shots:          [m.stats.shots.home,           m.stats.shots.away],
      shotsOnTarget:  [m.stats.shotsOnTarget.home,   m.stats.shotsOnTarget.away],
      corners:        [m.stats.corners.home,         m.stats.corners.away],
      fouls:          [m.stats.fouls.home,           m.stats.fouls.away],
      xg:             [m.stats.expectedGoals.home,   m.stats.expectedGoals.away],
    };
  }
}

export const matchEngine = new MatchEngine();
