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
      .sort((a, b) => this.kickoffMs(b) - this.kickoffMs(a))
      .slice(0, 2);
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
    // If an explicit competition ID is set, use it as the filter
    if (wcId !== undefined) return fixture.CompetitionId === wcId;

    // Otherwise filter by competition name OR kickoff date within WC 2026 window
    // WC 2026: June 11 – July 19, 2026 (with a small buffer either side)
    const WC_START = new Date('2026-06-01').getTime();
    const WC_END   = new Date('2026-07-31').getTime();

    const isWcName = (fixture.Competition ?? '').toLowerCase().includes('world cup');
    const startMs  = typeof fixture.StartTime === 'number'
      ? fixture.StartTime
      : new Date(fixture.StartTime ?? '').getTime();
    const isInWindow = Number.isFinite(startMs) && startMs >= WC_START && startMs <= WC_END;

    return isWcName || isInWindow;
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

      // 2. Bootstrap known finished fixtures that dropped off the snapshot
      // Only do this in mainnet WC mode (when a competition ID is configured)
      if (wcId !== undefined) {
        await this.bootstrapKnownFinished();
      }
    } catch (err: any) {
      logger.error('Historical bootstrap failed', { error: err.message });
    }
  }

  /**
   * Load fixtures we know are finished but no longer appear in the snapshot.
   * These are hardcoded because TxLINE's fixture/snapshot only returns active fixtures.
   */
  private async bootstrapKnownFinished() {
    logger.info(`Bootstrapping ${KNOWN_WC_FINISHED_FIXTURES.length} known-finished WC fixtures`);
    await Promise.allSettled(
      KNOWN_WC_FINISHED_FIXTURES.map(async (known) => {
        const id = String(known.FixtureId);
        if (this.matches.has(id)) return; // already loaded
        try {
          const events = await txLineClient.getScoresSnapshot(known.FixtureId);
          if (!events.length) return;
          const fixture: TxFixture = {
            FixtureId: known.FixtureId,
            StartTime: known.StartTime,
            Competition: 'FIFA World Cup 2026',
            CompetitionId: 72,
            Participant1: known.Participant1,
            Participant2: known.Participant2,
            Participant1IsHome: known.Participant1IsHome,
            GameState: null, // let events drive — they'll show game_finalised (StatusId=100)
          };
          const state = MatchNormalizer.normalize(fixture, events);
          state.winProbability = AIService.calculateWinProbability(state);
          this.matches.set(id, state);
          logger.info(`Bootstrapped finished fixture ${id} (${known.Participant1} vs ${known.Participant2}) — status: ${state.status} score: ${state.score.home}-${state.score.away}`);
          // Generate AI for finished match in background
          this.generateFinishedMatchAI(state).catch(() => {});
        } catch (err: any) {
          logger.error(`Failed to bootstrap known fixture ${id}`, { error: err.message });
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
        if (fixtureIsFinished) {
          events = await txLineClient.getHistoricalScores(fixture.FixtureId);
        } else {
          // For both live and upcoming, use snapshot — it's the most complete
          events = await txLineClient.getScoresSnapshot(fixture.FixtureId);
        }
      } catch {
        events = [];
      }

      const prev = this.matches.get(id);
      const next = MatchNormalizer.normalize(fixture, events);
      next.winProbability = AIService.calculateWinProbability(next);

      this.matches.set(id, next);

      if (!prev) {
        if (FINISHED_STATUSES.includes(next.status)) {
          // Run AI in background — don't block bootstrap
          this.generateFinishedMatchAI(next).catch(() => {/* ignore */});
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
    const key = `${match.id}-${match.minute}`;

    if (!scoreChanged && !periodicUpdate) return;
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
          pulse: [pulse],
          headline: pulse.split('. ')[0] ?? pulse,
        });
      }
    } catch (err: any) {
      logger.error(`Live AI generation failed for ${match.id}`, { error: err.message });
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
