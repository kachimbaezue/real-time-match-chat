import { MatchStats, TimelineEvent, MomentumState, MatchMomentum } from '../types';

export class MomentumEngine {
  /**
   * Calculates the momentum based on recent events and stats.
   * Returns a state and a numeric score between -100 (Away max) and 100 (Home max).
   */
  static calculateMomentum(stats: MatchStats, timeline: TimelineEvent[]): MatchMomentum {
    let score = 0;

    // 1. Possession contribution (max +/- 20)
    const possessionDiff = stats.possession.home - stats.possession.away;
    score += possessionDiff * 0.4; // 50% diff = 20 points

    // 2. Shots contribution (max +/- 30)
    const shotsDiff = stats.shots.home - stats.shots.away;
    score += shotsDiff * 2; 

    // 3. Dangerous Attacks (max +/- 20)
    const attacksDiff = stats.dangerousAttacks.home - stats.dangerousAttacks.away;
    score += attacksDiff * 0.5;

    // 4. Recent Events (last 10 minutes)
    const now = Date.now();
    const tenMinsAgo = now - 10 * 60 * 1000;
    
    const recentEvents = timeline.filter(e => new Date(e.timestamp).getTime() > tenMinsAgo);

    for (const event of recentEvents) {
      const multiplier = event.team === 'HOME' ? 1 : event.team === 'AWAY' ? -1 : 0;
      
      switch (event.type) {
        case 'GOAL':
          score += 30 * multiplier;
          break;
        case 'RED_CARD':
          score -= 40 * multiplier; // Penalize the team getting red card
          break;
        case 'YELLOW_CARD':
          score -= 10 * multiplier;
          break;
        case 'CORNER':
          score += 5 * multiplier;
          break;
        case 'PENALTY':
          score += 20 * multiplier;
          break;
      }
    }

    // Cap the score between -100 and 100
    score = Math.max(-100, Math.min(100, score));

    let state: MomentumState = 'Balanced';
    if (score > 20) state = 'Home';
    else if (score < -20) state = 'Away';

    return { state, score };
  }
}
