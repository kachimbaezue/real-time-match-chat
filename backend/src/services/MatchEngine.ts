import { txLineClient, TxFixture } from '../txline/TxLineClient';
import { MatchState, MatchStatus } from '../types';
import { MatchNormalizer } from './MatchNormalizer';
import { AIService } from '../ai/AIService';
import { socketService } from '../sockets/SocketService';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { getFallbackFixtureData, shouldUseFallbackFixtures } from './FixtureFallback';

const LIVE_STATUSES: MatchStatus[] = [
  'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'EXTRA_TIME', 'PENALTIES',
];

const FINISHED_STATUSES: MatchStatus[] = ['FINISHED'];

export class MatchEngine {
  private matches: Map<string, MatchState> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private historicalBootstrapped = false;
  private aiGeneratedFor: Set<string> = new Set();
  private finishedAiDone: Set<string> = new Set();

  startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    logger.info('Started polling MatchEngine');

    this.bootstrapHistorical()
      .then(() => {
        logger.info(`Bootstrap complete — ${this.getRecentMatches().length} recent matches in memory`);
        return this.tick();
      })
      .catch((e) => logger.error('Initial bootstrap/tick failed', { error: e.message }));

    this.pollingInterval = setInterval(() => this.tick(), 30_000);
  }

  stopPolling() {
    this.isPolling = false;
    if (this.pollingInterval) clearInterval(this.pollingInterval);
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
    if (wcId !== undefined) return fixture.CompetitionId === wcId;
    return fixture.Competition === 'World Cup';
  }

  private filterWorldCup(fixtures: TxFixture[]): TxFixture[] {
    return fixtures.filter((f) => this.isWorldCupFixture(f));
  }

  /**
   * One-time load of finished World Cup matches so Recent is populated on startup.
   *
   * TxLINE snapshot is the only reliable endpoint — /api/fixtures returns 404 on both
   * devnet and mainnet for guest credentials. The snapshot includes ALL fixtures for the
   * competition, and fixtures without a GameState field (undefined/null) are finished.
   *
   * On mainnet the snapshot has 100+ World Cup fixtures; on devnet it only has ~2 (the
   * current live/upcoming fixtures for the hackathon demo). Switch TXLINE_BASE_URL to
   * mainnet to get full historical data.
   */
  private async bootstrapHistorical() {
    if (this.historicalBootstrapped) return;
    this.historicalBootstrapped = true;

    const wcId = this.getWcCompetitionId();
    if (wcId === undefined) {
      logger.warn('TXLINE_WC_COMPETITION_ID not set — using fallback World Cup fixtures');
    }

    try {
      const snapshot = await txLineClient.getFixtures(wcId);
      const wcAll      = this.filterWorldCup(snapshot);
      const finished   = wcAll.filter((f) => MatchNormalizer.isFixtureFinished(f.GameState));
      const live       = wcAll.filter((f) => !MatchNormalizer.isFixtureFinished(f.GameState) && f.GameState !== 1 && f.GameState !== 6);
      const upcoming   = wcAll.filter((f) => f.GameState === 1 || f.GameState === 6);

      logger.info(
        `Snapshot: ${wcAll.length} WC fixtures total — ${finished.length} finished, ${live.length} live, ${upcoming.length} upcoming`
      );

      if (finished.length === 0 && shouldUseFallbackFixtures()) {
        logger.warn('No finished fixtures were returned; fallback fixture data will be used for recent matches.');
      }

      await Promise.allSettled(finished.map((fixture) => this.syncFixture(fixture)));
    } catch (err: any) {
      logger.error('Historical bootstrap failed', { error: err.message });
    }
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
          events = await txLineClient.getScoresSnapshot(fixture.FixtureId);
        }
      } catch {
        events = [];
      }

      const fallback = getFallbackFixtureData(fixture.FixtureId);
      const normalizedFixture = fallback?.fixture ?? fixture;
      const fallbackEvents = fallback?.events ?? events;
      const prev = this.matches.get(id);
      const next = MatchNormalizer.normalize(normalizedFixture, fallbackEvents);
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
