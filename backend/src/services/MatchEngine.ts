import { txLineClient, TxFixture } from '../txline/TxLineClient';
import { MatchState, MatchStatus } from '../types';
import { MatchNormalizer } from './MatchNormalizer';
import { AIService } from '../ai/AIService';
import { socketService } from '../sockets/SocketService';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const LIVE_STATUSES: MatchStatus[] = [
  'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'EXTRA_TIME', 'PENALTIES',
];

const FINISHED_STATUSES: MatchStatus[] = ['FINISHED'];

export class MatchEngine {
  private matches: Map<string, MatchState> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private aiGeneratedFor: Set<string> = new Set();
  private finishedAiDone: Set<string> = new Set();

  startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    logger.info('Started polling MatchEngine');
    this.tick().catch((e) => logger.error('Initial tick failed', { error: e.message }));
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
    return this.getAllMatches().filter((m) => FINISHED_STATUSES.includes(m.status));
  }

  private async tick() {
    try {
      const competitionId = env.TXLINE_WC_COMPETITION_ID
        ? parseInt(env.TXLINE_WC_COMPETITION_ID, 10)
        : undefined;

      const fixtures = await txLineClient.getFixtures(competitionId);
      logger.info(`Fetched ${fixtures.length} fixtures from TxLINE`);

      await Promise.allSettled(
        fixtures.map((fixture) => this.syncFixture(fixture))
      );
    } catch (err: any) {
      logger.error('MatchEngine tick failed', { error: err.message });
    }
  }

  private async syncFixture(fixture: TxFixture) {
    const id = String(fixture.FixtureId);
    try {
      const prevStatus = this.matches.get(id)?.status;
      const isKnownFinished = prevStatus && FINISHED_STATUSES.includes(prevStatus);

      // For finished matches: skip re-polling score events but still run
      // AI turning points if not done yet
      if (isKnownFinished) {
        if (!this.finishedAiDone.has(id)) {
          const match = this.matches.get(id)!;
          await this.generateFinishedMatchAI(match);
        }
        return;
      }

      let events: import('../txline/TxLineClient').TxScoreEvent[];
      try {
        events = await txLineClient.getScoresSnapshot(fixture.FixtureId);
      } catch {
        events = [];
      }

      const prev = this.matches.get(id);
      const next = MatchNormalizer.normalize(fixture, events);

      // Always compute win probability from our model
      next.winProbability = AIService.calculateWinProbability(next);

      this.matches.set(id, next);

      if (!prev) return;

      this.broadcastDiffs(prev, next);

      if (LIVE_STATUSES.includes(next.status)) {
        await this.maybeGenerateAI(next, prev);
      }

      // Match just finished — run finishing AI
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
