import { TxFixture, TxScoreEvent, TxPeriodScore } from '../txline/TxLineClient';
import { MatchState, MatchStatus, TimelineEvent, EventType } from '../types';
import { MomentumEngine } from './MomentumEngine';

/**
 * Normalizes real TxLINE API data into the MatchState shape.
 *
 * Real TxLINE event format (confirmed from live API):
 *  - Action (capital A) — event type string
 *  - Participant — number 1 or 2 (which team)
 *  - StatusId — 1=pre-match, 2=in-play (H1 or H2), 3=half-time
 *  - Clock — { Running: bool, Seconds: number } — game clock
 *  - Score — cumulative score object per participant per period
 *  - Stats — Record<string, number> with numeric keys
 *  - Seq — sequence number (use for ordering)
 *  - Ts — ms timestamp
 *
 * Fixture-level GameState: 1=scheduled, null/undefined=finished.
 * The fixture GameState does NOT change to reflect H1/H2/HT — use event StatusId.
 */
export class MatchNormalizer {

  /**
   * True when fixture-level GameState indicates the match has ended.
   * Only null/undefined = finished in the real API.
   */
  static isFixtureFinished(gameState?: number | null): boolean {
    return gameState === undefined || gameState === null;
  }

  /**
   * Determine match status from score events.
   * StatusId: 1=pre-match, 2=in-play (H1 or H2), 3=HT
   * We detect H2 by checking if any H2 clock event exceeds 45 minutes.
   * Finished matches come from the fixture-level GameState being null.
   */
  static deriveStatusFromEvents(events: TxScoreEvent[], fixtureGameState?: number | null): MatchStatus {
    // Fixture GameState null/undefined = finished
    if (fixtureGameState === undefined || fixtureGameState === null) {
      return 'FINISHED';
    }

    // Sort by Seq to get latest status
    const sorted = [...events].sort((a, b) => (b.Seq ?? 0) - (a.Seq ?? 0));

    // Find the latest event with a StatusId
    const latestWithStatus = sorted.find(e => e.StatusId !== undefined && e.StatusId !== null);

    if (!latestWithStatus) {
      // No events yet — fixture is scheduled
      return 'NOT_STARTED';
    }

    const statusId = latestWithStatus.StatusId!;

    if (statusId === 3) return 'HALF_TIME';

    if (statusId === 2) {
      // In-play — determine if H1 or H2 by max clock seconds
      const maxSeconds = Math.max(
        0,
        ...events
          .filter(e => e.Clock?.Seconds !== undefined)
          .map(e => e.Clock!.Seconds)
      );
      // If clock has gone beyond 45 mins (2700s), we're in H2
      return maxSeconds > 2700 ? 'SECOND_HALF' : 'FIRST_HALF';
    }

    if (statusId === 1) return 'NOT_STARTED';

    return 'NOT_STARTED';
  }

  /**
   * Build a MatchState from a TxFixture and its score events.
   */
  static normalize(fixture: TxFixture, events: TxScoreEvent[]): MatchState {
    const homeIsP1 = fixture.Participant1IsHome !== false;
    const homeTeam = homeIsP1 ? fixture.Participant1 : fixture.Participant2;
    const awayTeam = homeIsP1 ? fixture.Participant2 : fixture.Participant1;

    const status = this.deriveStatusFromEvents(events, fixture.GameState);

    // Current minute from max Clock.Seconds
    const maxSeconds = Math.max(
      0,
      ...events
        .filter(e => e.Clock?.Running === true && e.Clock.Seconds > 0)
        .map(e => e.Clock!.Seconds)
    );
    const minute = Math.floor(maxSeconds / 60);

    // Score: read from the latest Score object in events
    // The Score field carries cumulative totals — use the last event that has it
    const { homeScore, awayScore } = this.extractScore(events, homeIsP1);

    // Stats
    const stats = this.extractStats(events, homeIsP1);

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
      kickoffTime: String(fixture.StartTime ?? ''),
      stats,
      timeline,
      momentum,
    };
  }

  /**
   * Extract final score from the Score objects in events.
   * The Score field carries cumulative totals per period.
   * We use the Total.Goals field from the last event that has it.
   * If no Score object has Goals, count goal events as fallback.
   */
  private static extractScore(events: TxScoreEvent[], homeIsP1: boolean): { homeScore: number; awayScore: number } {
    // Find last event with a Score.Participant1 or Participant2 Total.Goals
    const sorted = [...events].sort((a, b) => (b.Seq ?? 0) - (a.Seq ?? 0));

    for (const e of sorted) {
      if (!e.Score) continue;
      const p1Goals = e.Score.Participant1?.Total?.Goals;
      const p2Goals = e.Score.Participant2?.Total?.Goals;
      if (p1Goals !== undefined || p2Goals !== undefined) {
        const p1 = p1Goals ?? 0;
        const p2 = p2Goals ?? 0;
        return homeIsP1
          ? { homeScore: p1, awayScore: p2 }
          : { homeScore: p2, awayScore: p1 };
      }
    }

    // Fallback: count "goal" action events
    let p1Goals = 0;
    let p2Goals = 0;
    for (const e of events) {
      if (e.Action?.toLowerCase() === 'goal') {
        if (e.Participant === 1) p1Goals++;
        else if (e.Participant === 2) p2Goals++;
      }
    }
    return homeIsP1
      ? { homeScore: p1Goals, awayScore: p2Goals }
      : { homeScore: p2Goals, awayScore: p1Goals };
  }

  /**
   * Extract stats from TxLINE events.
   *
   * The Score object on events tracks cumulative counts per participant/period.
   * Numeric Stats keys encode per-team/period data — we use the Score object
   * directly as it's cleaner and confirmed from the API.
   *
   * Also count events directly for shots, corners, cards.
   */
  private static extractStats(events: TxScoreEvent[], homeIsP1: boolean) {
    const stats = {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
      expectedGoals: { home: 0.0, away: 0.0 },
      passAccuracy: { home: 0, away: 0 },
      dangerousAttacks: { home: 0, away: 0 },
    };

    // Use latest Score object that has YellowCards/Corners/RedCards
    const sorted = [...events].sort((a, b) => (b.Seq ?? 0) - (a.Seq ?? 0));

    let cornersSet = false;
    let yellowsSet = false;
    let redsSet = false;

    for (const e of sorted) {
      if (!e.Score) continue;

      const p1 = e.Score.Participant1?.Total;
      const p2 = e.Score.Participant2?.Total;

      if (!cornersSet && (p1?.Corners !== undefined || p2?.Corners !== undefined)) {
        const p1c = p1?.Corners ?? 0;
        const p2c = p2?.Corners ?? 0;
        stats.corners.home = homeIsP1 ? p1c : p2c;
        stats.corners.away = homeIsP1 ? p2c : p1c;
        cornersSet = true;
      }

      if (!yellowsSet && (p1?.YellowCards !== undefined || p2?.YellowCards !== undefined)) {
        const p1y = p1?.YellowCards ?? 0;
        const p2y = p2?.YellowCards ?? 0;
        stats.yellowCards.home = homeIsP1 ? p1y : p2y;
        stats.yellowCards.away = homeIsP1 ? p2y : p1y;
        yellowsSet = true;
      }

      if (!redsSet && (p1?.RedCards !== undefined || p2?.RedCards !== undefined)) {
        const p1r = p1?.RedCards ?? 0;
        const p2r = p2?.RedCards ?? 0;
        stats.redCards.home = homeIsP1 ? p1r : p2r;
        stats.redCards.away = homeIsP1 ? p2r : p1r;
        redsSet = true;
      }

      if (cornersSet && yellowsSet && redsSet) break;
    }

    // Count shots from shot action events
    let p1Shots = 0, p2Shots = 0, p1OnTarget = 0, p2OnTarget = 0;
    let p1Corners = 0, p2Corners = 0;
    let p1Yellows = 0, p2Yellows = 0, p1Reds = 0, p2Reds = 0;
    let p1Danger = 0, p2Danger = 0;
    let totalPossessionEvents = 0, p1PossessionEvents = 0;

    for (const e of events) {
      const action = (e.Action ?? '').toLowerCase();
      const isP1 = e.Participant === 1;

      if (action === 'shot') {
        if (isP1) { p1Shots++; if ((e.Data?.Outcome as string) === 'OnTarget') p1OnTarget++; }
        else { p2Shots++; if ((e.Data?.Outcome as string) === 'OnTarget') p2OnTarget++; }
      }

      if (action === 'corner') {
        if (isP1) p1Corners++; else p2Corners++;
      }

      if (action === 'yellow_card') {
        if (isP1) p1Yellows++; else p2Yellows++;
      }

      if (action === 'red_card') {
        if (isP1) p1Reds++; else p2Reds++;
      }

      if (['danger_possession', 'high_danger_possession', 'attack_possession'].includes(action)) {
        if (isP1) p1Danger++; else p2Danger++;
      }

      // Possession tracking from possession/attack events with Possession field
      if (e.Possession !== undefined && ['possession', 'attack_possession', 'danger_possession',
          'high_danger_possession', 'safe_possession'].includes(action)) {
        totalPossessionEvents++;
        if (e.Possession === 1) p1PossessionEvents++;
      }
    }

    // Apply shot counts
    if (p1Shots + p2Shots > 0) {
      stats.shots.home = homeIsP1 ? p1Shots : p2Shots;
      stats.shots.away = homeIsP1 ? p2Shots : p1Shots;
      stats.shotsOnTarget.home = homeIsP1 ? p1OnTarget : p2OnTarget;
      stats.shotsOnTarget.away = homeIsP1 ? p2OnTarget : p1OnTarget;
    }

    // Use event-counted corners if Score object didn't have them
    if (!cornersSet && p1Corners + p2Corners > 0) {
      stats.corners.home = homeIsP1 ? p1Corners : p2Corners;
      stats.corners.away = homeIsP1 ? p2Corners : p1Corners;
    }

    // Use event-counted cards if Score object didn't have them
    if (!yellowsSet && p1Yellows + p2Yellows > 0) {
      stats.yellowCards.home = homeIsP1 ? p1Yellows : p2Yellows;
      stats.yellowCards.away = homeIsP1 ? p2Yellows : p1Yellows;
    }
    if (!redsSet && p1Reds + p2Reds > 0) {
      stats.redCards.home = homeIsP1 ? p1Reds : p2Reds;
      stats.redCards.away = homeIsP1 ? p2Reds : p1Reds;
    }

    // Dangerous attacks
    if (p1Danger + p2Danger > 0) {
      stats.dangerousAttacks.home = homeIsP1 ? p1Danger : p2Danger;
      stats.dangerousAttacks.away = homeIsP1 ? p2Danger : p1Danger;
    }

    // Possession from event counts
    if (totalPossessionEvents > 0) {
      const p1Pct = Math.round((p1PossessionEvents / totalPossessionEvents) * 100);
      const p2Pct = 100 - p1Pct;
      stats.possession.home = homeIsP1 ? p1Pct : p2Pct;
      stats.possession.away = homeIsP1 ? p2Pct : p1Pct;
    }

    return stats;
  }

  /**
   * Build timeline from relevant score events.
   */
  private static buildTimeline(events: TxScoreEvent[], homeIsP1: boolean): TimelineEvent[] {
    const relevant = new Set([
      'goal', 'yellow_card', 'red_card', 'penalty', 'substitution',
      'corner', 'kickoff', 'status', 'free_kick',
    ]);

    return events
      .filter(e => e.Action && relevant.has(e.Action.toLowerCase()) && e.Confirmed !== false)
      .map((e): TimelineEvent => {
        const isP1 = e.Participant === 1;
        const isHome = homeIsP1 ? isP1 : !isP1;
        const minute = e.Clock?.Seconds ? Math.floor(e.Clock.Seconds / 60) : 0;
        return {
          id: `${e.FixtureId}-${e.Seq}`,
          minute,
          type: this.actionToEventType(e.Action ?? ''),
          title: this.actionToLabel(e.Action ?? ''),
          description: this.actionToLabel(e.Action ?? ''),
          team: e.Participant !== undefined ? (isHome ? 'HOME' : 'AWAY') : 'NONE',
          player: undefined,
          timestamp: new Date(e.Ts ?? 0).toISOString(),
        };
      })
      .sort((a, b) => b.minute - a.minute);
  }

  static actionToEventType(action: string): EventType {
    switch ((action ?? '').toLowerCase()) {
      case 'goal':         return 'GOAL';
      case 'yellow_card':  return 'YELLOW_CARD';
      case 'red_card':     return 'RED_CARD';
      case 'penalty':      return 'PENALTY';
      case 'substitution': return 'SUBSTITUTION';
      case 'corner':       return 'CORNER';
      default:             return 'MATCH_STATUS';
    }
  }

  private static actionToLabel(action: string): string {
    const map: Record<string, string> = {
      goal: 'Goal', yellow_card: 'Yellow Card', red_card: 'Red Card',
      penalty: 'Penalty', substitution: 'Substitution', corner: 'Corner',
      kickoff: 'Kick Off', status: 'Status Update', free_kick: 'Free Kick',
    };
    return map[action.toLowerCase()] ?? action;
  }
}
