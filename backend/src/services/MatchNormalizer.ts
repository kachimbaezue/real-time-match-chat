import { TxFixture, TxScoreEvent } from '../txline/TxLineClient';
import { MatchState, MatchStatus, TimelineEvent, EventType } from '../types';
import { MomentumEngine } from './MomentumEngine';

/**
 * Normalizes raw TxLINE data into the MatchState shape used throughout the backend.
 */
export class MatchNormalizer {
  /**
   * Map TxLINE gameState string to our MatchStatus enum.
   * TxLINE phase codes: NS=1, H1=2, HT=3, H2=4, F=5, ET1=7, HTET=8, ET2=9, FET=10, WPE=11, PE=12, FPE=13
   */
  static gameStateToStatus(gameState?: string | number): MatchStatus {
    const g = String(gameState ?? '').toUpperCase();
    switch (g) {
      case 'H1': case '2': return 'FIRST_HALF';
      case 'HT': case '3': return 'HALF_TIME';
      case 'H2': case '4': return 'SECOND_HALF';
      case 'F':  case '5': return 'FINISHED';
      case 'ET1': case '7': return 'EXTRA_TIME';
      case 'HTET': case '8': return 'EXTRA_TIME';
      case 'ET2': case '9': return 'EXTRA_TIME';
      case 'FET': case '10': return 'FINISHED';
      case 'WPE': case '11': return 'EXTRA_TIME';
      case 'PE':  case '12': return 'PENALTIES';
      case 'FPE': case '13': return 'FINISHED';
      default: return 'NOT_STARTED';
    }
  }

  /**
   * Map TxLINE action string to our EventType enum.
   */
  static actionToEventType(action?: string): EventType {
    switch ((action ?? '').toLowerCase()) {
      case 'goal':              return 'GOAL';
      case 'yellow_card':       return 'YELLOW_CARD';
      case 'red_card':          return 'RED_CARD';
      case 'penalty':           return 'PENALTY';
      case 'substitution':      return 'SUBSTITUTION';
      case 'corner':            return 'CORNER';
      case 'var':
      case 'var_end':           return 'CORNER'; // closest generic
      case 'match_status':
      case 'game_phase':        return 'MATCH_STATUS';
      default:                  return 'MATCH_STATUS';
    }
  }

  /**
   * Build a MatchState from a TxFixture and its score events.
   */
  static normalize(fixture: TxFixture, events: TxScoreEvent[]): MatchState {
    const homeIsP1 = fixture.Participant1IsHome !== false;
    const homeTeam = homeIsP1 ? fixture.Participant1 : fixture.Participant2;
    const awayTeam = homeIsP1 ? fixture.Participant2 : fixture.Participant1;

    // Determine current game state from the last event that has one
    const lastStateEvent = [...events].reverse().find((e) => e.gameState);
    const status = this.gameStateToStatus(lastStateEvent?.gameState);

    // Current minute from the last event that has one
    const lastMinuteEvent = [...events].reverse().find((e) => e.minute !== undefined);
    const minute = lastMinuteEvent?.minute ?? 0;

    // Score: count confirmed goals
    let homeScore = 0;
    let awayScore = 0;
    for (const e of events) {
      if (e.action === 'goal') {
        const isHomeTeam = homeIsP1
          ? e.team === 'Participant1'
          : e.team === 'Participant2';
        if (isHomeTeam) homeScore++;
        else awayScore++;
      }
    }

    // Stats: extract from stat events (TxLINE encodes as stat keys)
    const stats = this.extractStats(events);

    // Timeline
    const timeline = this.buildTimeline(events, homeIsP1);

    // Momentum
    const momentum = MomentumEngine.calculateMomentum(stats, timeline);

    return {
      id: String(fixture.FixtureId),
      homeTeam,
      awayTeam,
      score: { home: homeScore, away: awayScore },
      minute,
      status,
      competition: fixture.Competition ?? 'FIFA World Cup 2026',
      venue: fixture.Venue ?? '',
      kickoffTime: fixture.StartTime,
      stats,
      timeline,
      momentum,
    };
  }

  private static extractStats(events: TxScoreEvent[]) {
    // TxLINE encodes stats as numeric keys in STATISTICS events.
    // Keys: 1=P1 goals, 2=P2 goals, 3=P1 yellow, 4=P2 yellow,
    //       5=P1 red, 6=P2 red, 7=P1 corners, 8=P2 corners
    // Prefix 0=total, 1000=H1, 3000=H2
    const stats = {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
      expectedGoals: { home: 0, away: 0 },
      passAccuracy: { home: 0, away: 0 },
      dangerousAttacks: { home: 0, away: 0 },
    };

    for (const e of events) {
      if (e.action === 'statistics' && e.Data) {
        const d = e.Data as Record<string, number>;
        // Total period keys (prefix 0)
        if (d[3]  !== undefined) stats.yellowCards.home = d[3];
        if (d[4]  !== undefined) stats.yellowCards.away = d[4];
        if (d[5]  !== undefined) stats.redCards.home    = d[5];
        if (d[6]  !== undefined) stats.redCards.away    = d[6];
        if (d[7]  !== undefined) stats.corners.home     = d[7];
        if (d[8]  !== undefined) stats.corners.away     = d[8];
        if (d['possession_home'] !== undefined) stats.possession.home = d['possession_home'];
        if (d['possession_away'] !== undefined) stats.possession.away = d['possession_away'];
        if (d['shots_home']      !== undefined) stats.shots.home      = d['shots_home'];
        if (d['shots_away']      !== undefined) stats.shots.away      = d['shots_away'];
        if (d['shots_on_home']   !== undefined) stats.shotsOnTarget.home = d['shots_on_home'];
        if (d['shots_on_away']   !== undefined) stats.shotsOnTarget.away = d['shots_on_away'];
        if (d['attacks_home']    !== undefined) stats.dangerousAttacks.home = d['attacks_home'];
        if (d['attacks_away']    !== undefined) stats.dangerousAttacks.away = d['attacks_away'];
      }

      // Count shots from shot events
      if (e.action === 'shot') {
        const isHome = e.team === 'Participant1';
        if (isHome) stats.shots.home++;
        else stats.shots.away++;
        const outcome = (e.Data?.Outcome as string | undefined) ?? '';
        if (outcome === 'OnTarget') {
          if (isHome) stats.shotsOnTarget.home++;
          else stats.shotsOnTarget.away++;
        }
      }

      // Count corners from corner events
      if (e.action === 'corner') {
        if (e.team === 'Participant1') stats.corners.home++;
        else stats.corners.away++;
      }

      // Count yellow/red cards from card events
      if (e.action === 'yellow_card') {
        if (e.team === 'Participant1') stats.yellowCards.home++;
        else stats.yellowCards.away++;
      }
      if (e.action === 'red_card') {
        if (e.team === 'Participant1') stats.redCards.home++;
        else stats.redCards.away++;
      }
    }

    return stats;
  }

  private static buildTimeline(events: TxScoreEvent[], homeIsP1: boolean): TimelineEvent[] {
    const relevant = ['goal', 'yellow_card', 'red_card', 'penalty', 'substitution',
                      'corner', 'match_status', 'game_phase', 'game_finalised'];
    
    return events
      .filter((e) => e.action && relevant.includes(e.action.toLowerCase()))
      .map((e): TimelineEvent => {
        const isP1 = e.team === 'Participant1';
        const isHome = homeIsP1 ? isP1 : !isP1;
        return {
          id: `${e.FixtureId}-${e.seq}`,
          minute: e.minute ?? 0,
          type: this.actionToEventType(e.action),
          title: this.actionToLabel(e.action ?? ''),
          description: (e.player ?? '') || this.actionToLabel(e.action ?? ''),
          team: e.team ? (isHome ? 'HOME' : 'AWAY') : 'NONE',
          player: e.player,
          timestamp: e.ts,
        };
      })
      .sort((a, b) => b.minute - a.minute); // newest first
  }

  private static actionToLabel(action: string): string {
    const map: Record<string, string> = {
      goal: 'Goal',
      yellow_card: 'Yellow Card',
      red_card: 'Red Card',
      penalty: 'Penalty',
      substitution: 'Substitution',
      corner: 'Corner',
      game_finalised: 'Full Time',
      match_status: 'Status Update',
      game_phase: 'Phase Change',
    };
    return map[action.toLowerCase()] ?? action;
  }
}
