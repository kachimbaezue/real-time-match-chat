import { MatchState } from '../types';
// import { txLineClient } from '../txline/TxLineClient';
import { MomentumEngine } from './MomentumEngine';
import { AIService } from '../ai/AIService';
import { logger } from '../utils/logger';
import { socketService } from '../sockets/SocketService';

export class MatchEngine {
  private matches: Map<string, MatchState> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor() {
    // Initialize with a mock match for demonstration purposes if TxLINE isn't available
    this.matches.set('mock-1', {
      id: 'mock-1',
      homeTeam: 'Brazil',
      awayTeam: 'Argentina',
      score: { home: 0, away: 0 },
      minute: 0,
      status: 'FIRST_HALF',
      competition: 'World Cup',
      venue: 'Lusail Stadium',
      kickoffTime: new Date().toISOString(),
      stats: {
        possession: { home: 50, away: 50 },
        shots: { home: 0, away: 0 },
        shotsOnTarget: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 },
        redCards: { home: 0, away: 0 },
        expectedGoals: { home: 0.0, away: 0.0 },
        passAccuracy: { home: 85, away: 85 },
        dangerousAttacks: { home: 0, away: 0 },
      },
      timeline: [],
      momentum: { state: 'Balanced', score: 0 },
    });
  }

  startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    logger.info('Started polling MatchEngine');

    this.pollingInterval = setInterval(async () => {
      await this.tick();
    }, 10000); // Poll every 10 seconds
  }

  stopPolling() {
    this.isPolling = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    logger.info('Stopped polling MatchEngine');
  }

  getMatch(id: string): MatchState | undefined {
    return this.matches.get(id);
  }

  getAllMatches(): MatchState[] {
    return Array.from(this.matches.values());
  }

  private async tick() {
    try {
      // In a real scenario, we fetch live matches from TxLINE
      // const liveData = await txLineClient.getLiveMatches();
      // this.updateMatches(liveData);

      // Simulate a tick for the mock match
      const mockMatch = this.matches.get('mock-1');
      if (mockMatch && mockMatch.status === 'FIRST_HALF') {
        mockMatch.minute += 1;
        
        // Randomly simulate an event
        if (Math.random() > 0.8) {
          const isHome = Math.random() > 0.5;
          const team = isHome ? 'HOME' : 'AWAY';
          mockMatch.timeline.push({
            id: Date.now().toString(),
            minute: mockMatch.minute,
            type: 'SHOT',
            title: 'Shot',
            description: 'A shot was taken',
            team,
            timestamp: new Date().toISOString()
          } as any);

          if (isHome) mockMatch.stats.shots.home++;
          else mockMatch.stats.shots.away++;

          // Recalculate momentum
          mockMatch.momentum = MomentumEngine.calculateMomentum(mockMatch.stats, mockMatch.timeline);
          socketService.broadcastToMatch(mockMatch.id, 'momentum_updated', mockMatch.momentum);
          socketService.broadcastToMatch(mockMatch.id, 'stats_updated', mockMatch.stats);
          socketService.broadcastToMatch(mockMatch.id, 'timeline_updated', mockMatch.timeline);

          // Update AI pulse periodically
          if (mockMatch.minute % 5 === 0) {
            mockMatch.pulse = await AIService.generateMatchPulse(mockMatch);
            socketService.broadcastToMatch(mockMatch.id, 'pulse_updated', mockMatch.pulse);

            mockMatch.recap = await AIService.generateMatchRecap(mockMatch);
            socketService.broadcastToMatch(mockMatch.id, 'recap_updated', mockMatch.recap);
          }
        }
        
        socketService.broadcastToMatch(mockMatch.id, 'score_updated', {
          score: mockMatch.score,
          minute: mockMatch.minute,
          status: mockMatch.status
        });
      }
    } catch (error: any) {
      logger.error('Error during MatchEngine tick', { error: error.message });
    }
  }
}

export const matchEngine = new MatchEngine();
