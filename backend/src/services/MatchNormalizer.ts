import { TxFixture, TxScoreEvent } from '../txline/TxLineClient';
import { MatchState, MatchStatus, TimelineEvent, EventType } from '../types';
import { MomentumEngine } from './MomentumEngine';

/**
 * Normalizes raw TxLINE PascalCase API data into our internal MatchState shape.
 *
 * TxLINE field conventions (confirmed from live data):
 *   - All event fields are PascalCase: Action, StatusId, Clock, Stats, Data, Participant, Score
 *   - Clock.Seconds = elapsed seconds in the current period
 *   - StatusId = match phase: 1=pre, 2=H1, 3=HT, 4=H2, 5=FT, 7=ET1, 8=HTET, 9=ET2, 10=FET, 11=WPE, 12=PE, 13=FPE
 *   - Stats = numeric-keyed object on every event (cumulative game totals)
 *   - Score = cumulative score object present on key events (goals, cards, corners)
 *   - Participant = 1|2 (which team did the action)
 */
export class MatchNormalizer {
  /**
   * Get the action string from an event — handles both PascalCase (real API)
   * and camelCase (legacy/serialized).
   */
  private static getAction(e: TxScoreEvent): string {
    return ((e.Action ?? e.action) ?? '').toLowerCase();
  }

  /**
   * Get which participant (1 or 2) performed the action.
   */
  private static getParticipant(e: TxScoreEvent): 1 | 2 | undefined {
    return e.Participant ?? undefined;
  }

  /**
   * Get the StatusId / phase from an event.
   */
  private static getStatusId(e: TxScoreEvent): number | undefined {
    return e.StatusId ?? undefined;
  }

  /**
   * Get Clock.Seconds from an event, returning 0 if not present.
   */
  private static getClockSeconds(e: TxScoreEvent): number {
    return e.Clock?.Seconds ?? e.minute ?? 0;
  }

  /**
   * Convert Clock.Seconds + StatusId to the correct match minute.
   *
   * TxLINE resets Clock.Seconds to 0 at the start of each period:
   *   StatusId 2 (H1):    0–45 min  → raw seconds + 0
   *   StatusId 3 (HT):    show as 45'
   *   StatusId 4 (H2):    46–90 min → raw seconds + 45*60
   *   StatusId 5 (FT):    show as 90'
   *   StatusId 7/8/9 (ET):91–120 min→ raw seconds + 90*60
   *   StatusId 12 (PE):   show as 120'
   */
  private static clockToMinute(seconds: number, statusId?: number): number {
    let offset = 0;
    switch (statusId) {
      case 4: offset = 45 * 60; break;    // H2 — add 45 min
      case 3: return 45;                   // HT marker
      case 5: case 10: case 13: return 90; // FT marker
      case 7: case 8: case 9: case 11:
        offset = 90 * 60; break;           // ET — add 90 min
      case 12: return 120;                 // Penalties marker
      default: offset = 0; break;         // H1 or unknown — no offset
    }
    return Math.max(1, Math.ceil((seconds + offset) / 60));
  }

  /**
   * Map TxLINE StatusId (phase integer) to our MatchStatus.
   * 1=pre, 2=H1, 3=HT, 4=H2, 5=FT, 7=ET1, 8=HTET, 9=ET2, 10=FET, 11=WPE, 12=PE, 13=FPE
   * 100=game_finalised (confirmed from live data — means match is fully over)
   */
  static statusIdToStatus(statusId?: number): MatchStatus {
    switch (statusId) {
      case 1:   return 'NOT_STARTED';
      case 2:   return 'FIRST_HALF';
      case 3:   return 'HALF_TIME';
      case 4:   return 'SECOND_HALF';
      case 5:   return 'FINISHED';
      case 7:   return 'EXTRA_TIME';
      case 8:   return 'EXTRA_TIME';
      case 9:   return 'EXTRA_TIME';
      case 10:  return 'FINISHED';
      case 11:  return 'EXTRA_TIME';
      case 12:  return 'PENALTIES';
      case 13:  return 'FINISHED';
      case 100: return 'FINISHED';   // game_finalised — confirmed from live data
      // Unknown StatusId: return undefined so the caller can fall back to other signals
      default:  return undefined as unknown as MatchStatus;
    }
  }

  /**
   * Map TxLINE fixture-level GameState to our MatchStatus.
   * GameState null/undefined = finished (TxLINE convention for past matches).
   * GameState 1 = scheduled, 6 = cancelled.
   */
  static fixtureGameStateToStatus(gameState?: number | null): MatchStatus {
    if (gameState === undefined || gameState === null) return 'FINISHED';
    if (gameState === 6) return 'NOT_STARTED';
    if (gameState === 1) return 'NOT_STARTED';
    return this.statusIdToStatus(gameState);
  }

  /**
   * True when the fixture-level GameState means the match is over.
   *
   * NOTE: TxLINE historically used null/undefined to mean "finished", but
   * live matches occasionally arrive with GameState=null when the phase has
   * not been explicitly set on the fixture record yet.  We now treat
   * null/undefined as "unknown" rather than "finished" so that syncFixture
   * always fetches the full live snapshot — the normalizer then resolves the
   * real status from the StatusId present inside the score events, which is
   * always authoritative.
   */
  static isFixtureFinished(gameState?: number | null): boolean {
    if (gameState === undefined || gameState === null) return false; // treat unknown as not-finished
    return [5, 10, 13].includes(gameState);
  }

  /**
   * @deprecated Use statusIdToStatus instead.
   * Kept for any code that still passes a string gameState.
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
   * Map TxLINE Action string to our EventType enum.
   */
  static actionToEventType(action?: string): EventType {
    switch ((action ?? '').toLowerCase()) {
      case 'goal':              return 'GOAL';
      case 'yellow_card':       return 'YELLOW_CARD';
      case 'red_card':          return 'RED_CARD';
      case 'penalty':           return 'PENALTY';
      case 'substitution':      return 'SUBSTITUTION';
      case 'corner':            return 'CORNER';
      case 'status':
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

    // ── Determine match status ──────────────────────────────────────────────
    // Use the highest StatusId seen across all events (most recent match phase).
    // StatusId 5/10/13 = FT variations, 2=H1, 3=HT, 4=H2 — pick the latest.
    let status: MatchStatus;
    const highestStatusId = this.getHighestStatusId(events);
    if (highestStatusId !== undefined) {
      const resolved = this.statusIdToStatus(highestStatusId);
      // statusIdToStatus returns undefined for unknown IDs — fall back below
      status = resolved ?? this.fixtureGameStateToStatus(fixture.GameState as number | null | undefined);
    } else {
      // No events with StatusId — fall back to fixture GameState
      status = this.fixtureGameStateToStatus(fixture.GameState as number | null | undefined);
    }

    // ── Current minute from Clock.Seconds + StatusId ──────────────────────
    // Find the event with the highest absolute time (period-adjusted) for the current minute
    let maxAdjustedSeconds = 0;
    for (const e of events) {
      const secs = this.getClockSeconds(e);
      const sid = this.getStatusId(e);
      let offset = 0;
      switch (sid) {
        case 4: offset = 45 * 60; break;
        case 7: case 8: case 9: case 11: offset = 90 * 60; break;
        case 12: offset = 120 * 60; break;
        default: offset = 0;
      }
      const adjusted = secs + offset;
      if (adjusted > maxAdjustedSeconds) maxAdjustedSeconds = adjusted;
    }
    const minute = Math.max(1, Math.ceil(maxAdjustedSeconds / 60));

    // ── Infer live status from clock time when status is still ambiguous ───
    if ((!status || status === 'NOT_STARTED') && maxAdjustedSeconds > 0) {
      if (maxAdjustedSeconds > 90 * 60) {
        status = 'EXTRA_TIME';
      } else if (maxAdjustedSeconds > 45 * 60) {
        status = 'SECOND_HALF';
      } else {
        status = 'FIRST_HALF';
      }
    }

    // Final safety net — default to NOT_STARTED if still unresolved
    if (!status) status = 'NOT_STARTED';

    // ── Score from the Score.*.Total.Goals field on events ─────────────────
    // The Score object is present on key events and is always cumulative.
    // We take the latest event that has a Score with a Goals field.
    const { homeScore, awayScore } = this.extractScore(events, homeIsP1);

    // ── Stats ───────────────────────────────────────────────────────────────
    const stats = this.extractStats(events, homeIsP1);


    // ── Timeline ────────────────────────────────────────────────────────────
    const timeline = this.buildTimeline(events, homeIsP1);

    // ── Momentum ────────────────────────────────────────────────────────────
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
   * Find the highest-priority StatusId across all events.
   * Priority: game_finalised(100) > FT(5,10,13) > PE(12) > ET(7,8,9,11) > H2(4) > HT(3) > H1(2) > pre(1)
   */
  private static getHighestStatusId(events: TxScoreEvent[]): number | undefined {
    const FT_IDS = new Set([5, 10, 13, 100]); // 100 = game_finalised
    let highest: number | undefined;

    for (const e of events) {
      const sid = this.getStatusId(e);
      if (sid === undefined) continue;
      if (highest === undefined) { highest = sid; continue; }
      // game_finalised (100) is the definitive end — always prefer it
      if (sid === 100) { highest = 100; continue; }
      if (highest === 100) continue;
      // Otherwise prefer FT states over live phases
      if (FT_IDS.has(sid) && !FT_IDS.has(highest)) { highest = sid; continue; }
      if (!FT_IDS.has(sid) && FT_IDS.has(highest)) continue;
      if (sid > highest) highest = sid;
    }
    return highest;
  }

  /**
   * Extract score from events.
   *
   * Strategy (confirmed from live terminal data):
   * 1. PRIMARY: Read Stats keys "1" (P1 goals) and "2" (P2 goals) from the
   *    latest event that has a non-empty Stats object. These are the running
   *    cumulative totals confirmed on the FT status event.
   * 2. FALLBACK: Read Score.*.Total.Goals from Score objects.
   * 3. LAST RESORT: Count Action='goal' events.
   */
  private static extractScore(
    events: TxScoreEvent[],
    homeIsP1: boolean,
  ): { homeScore: number; awayScore: number } {
    let p1Goals = 0;
    let p2Goals = 0;

    // Strategy 1: Stats keys "1" and "2" from latest stats event
    // Walk backwards for the latest event with a populated Stats
    for (let i = events.length - 1; i >= 0; i--) {
      const s = events[i].Stats;
      if (!s || Object.keys(s).length === 0) continue;
      // Stats key "1" = P1 total goals, "2" = P2 total goals (confirmed)
      const k1 = s['1'] ?? s[1];
      const k2 = s['2'] ?? s[2];
      if (k1 !== undefined || k2 !== undefined) {
        p1Goals = Number(k1 ?? 0);
        p2Goals = Number(k2 ?? 0);
        break;
      }
    }

    // Strategy 2: Score.*.Total.Goals (fallback when Stats missing)
    if (p1Goals === 0 && p2Goals === 0) {
      for (let i = events.length - 1; i >= 0; i--) {
        const score = events[i].Score;
        if (!score) continue;
        const p1g = score.Participant1?.Total?.Goals ?? score.Participant1?.HT?.Goals;
        const p2g = score.Participant2?.Total?.Goals ?? score.Participant2?.HT?.Goals;
        if (p1g !== undefined || p2g !== undefined) {
          p1Goals = p1g ?? 0;
          p2Goals = p2g ?? 0;
          break;
        }
      }
    }

    // Strategy 3: Count confirmed goal events
    if (p1Goals === 0 && p2Goals === 0) {
      for (const e of events) {
        if (this.getAction(e) === 'goal' && e.Confirmed !== false) {
          const participant = this.getParticipant(e);
          if (participant === 1) p1Goals++;
          else if (participant === 2) p2Goals++;
        }
      }
    }

    return {
      homeScore: homeIsP1 ? p1Goals : p2Goals,
      awayScore: homeIsP1 ? p2Goals : p1Goals,
    };
  }

  /**
   * Extract match statistics.
   *
   * TxLINE Stats object uses numeric keys. Based on confirmed live data:
   *   Stat key map (per participant prefix):
   *     Each event includes a Stats flat object — the keys follow this pattern:
   *       Single digit (1-8): totals
   *       1001-8008: H1 stats  (prefix 1000)
   *       2001-2008: H2 stats  (prefix 2000)
   *
   *   Confirmed from live snapshot (by tracking goal/corner/card score objects):
   *     Key 7  = P1 corners total
   *     Key 8  = P2 corners total  (confirmed: both "1" in corner event)
   *     Key 3  = P1 yellow cards
   *     Key 4  = P2 yellow cards  (inferred; 1003/1004 H1)
   *     Key 1  = P1 goals         (inferred)
   *     Key 2  = P2 goals         (inferred)
   *
   *   Shots: counted from Action='shot' events (Score/Stats don't include shots)
   *   Possession: use Possession field on possession-type events
   *   Danger attacks: count danger_possession + high_danger_possession + attack_possession events
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
      expectedGoals: { home: 0, away: 0 },
      passAccuracy: { home: 0, away: 0 },
      dangerousAttacks: { home: 0, away: 0 },
    };

    // Try to read from the most recent Stats object with populated values
    // Walk backwards to find an event that has a non-empty Stats block
    let latestStats: Record<string, number> | undefined;
    for (let i = events.length - 1; i >= 0; i--) {
      const s = events[i].Stats;
      if (s && Object.keys(s).length > 0) {
        latestStats = s;
        break;
      }
    }

    if (latestStats) {
      // Corners: key 7=P1, key 8=P2 (confirmed from live data)
      const p1Corners = latestStats['7'] ?? 0;
      const p2Corners = latestStats['8'] ?? 0;
      stats.corners.home = homeIsP1 ? p1Corners : p2Corners;
      stats.corners.away = homeIsP1 ? p2Corners : p1Corners;

      // Yellow cards: key 3=P1, key 4=P2 (inferred from Score.*.Total.YellowCards)
      const p1Yellow = latestStats['3'] ?? 0;
      const p2Yellow = latestStats['4'] ?? 0;
      stats.yellowCards.home = homeIsP1 ? p1Yellow : p2Yellow;
      stats.yellowCards.away = homeIsP1 ? p2Yellow : p1Yellow;

      // Red cards: key 5=P1, key 6=P2
      const p1Red = latestStats['5'] ?? 0;
      const p2Red = latestStats['6'] ?? 0;
      stats.redCards.home = homeIsP1 ? p1Red : p2Red;
      stats.redCards.away = homeIsP1 ? p2Red : p1Red;
    }

    // Also cross-check from Score objects (more reliable for cards/corners)
    // Find the latest event with a Score.*.Total object
    for (let i = events.length - 1; i >= 0; i--) {
      const score = events[i].Score;
      if (!score) continue;
      const p1Total = score.Participant1?.Total;
      const p2Total = score.Participant2?.Total;
      if (!p1Total && !p2Total) continue;

      if (p1Total?.Corners !== undefined || p2Total?.Corners !== undefined) {
        const p1c = p1Total?.Corners ?? 0;
        const p2c = p2Total?.Corners ?? 0;
        stats.corners.home = homeIsP1 ? p1c : p2c;
        stats.corners.away = homeIsP1 ? p2c : p1c;
      }
      if (p1Total?.YellowCards !== undefined || p2Total?.YellowCards !== undefined) {
        const p1y = p1Total?.YellowCards ?? 0;
        const p2y = p2Total?.YellowCards ?? 0;
        stats.yellowCards.home = homeIsP1 ? p1y : p2y;
        stats.yellowCards.away = homeIsP1 ? p2y : p1y;
      }
      break; // most recent Score object is sufficient
    }

    // Count shots from Action='shot' events
    let p1Shots = 0; let p2Shots = 0;
    let p1ShotsOn = 0; let p2ShotsOn = 0;
    let p1DangerousAttacks = 0; let p2DangerousAttacks = 0;
    let p1Fouls = 0; let p2Fouls = 0;

    // Track last possession event for possession %
    let lastPossessionP1: number | undefined;

    for (const e of events) {
      const action = this.getAction(e);
      const participant = this.getParticipant(e);

      if (action === 'shot' && e.Confirmed !== false) {
        if (participant === 1) {
          p1Shots++;
          const outcome = (e.Data?.Outcome as string | undefined) ?? '';
          if (outcome === 'OnTarget') p1ShotsOn++;
        } else if (participant === 2) {
          p2Shots++;
          const outcome = (e.Data?.Outcome as string | undefined) ?? '';
          if (outcome === 'OnTarget') p2ShotsOn++;
        }
      }

      if (
        action === 'attack_possession' ||
        action === 'danger_possession' ||
        action === 'high_danger_possession'
      ) {
        if (participant === 1 || e.Possession === 1) p1DangerousAttacks++;
        else if (participant === 2 || e.Possession === 2) p2DangerousAttacks++;
      }

      if (action === 'free_kick' && e.Confirmed) {
        // Free kicks awarded to opponent = foul committed
        if (participant === 1) p2Fouls++;
        else if (participant === 2) p1Fouls++;
      }

      // Possession: read from possession/safe_possession events
      if (
        (action === 'possession' || action === 'safe_possession') &&
        e.Possession !== undefined
      ) {
        lastPossessionP1 = e.Possession === 1 ? 1 : 0;
      }
    }

    // Use the 3000-series stats keys from TxLINE first (more reliable)
    if (latestStats) {
      const p1ShotsTx = latestStats['3001'] ?? 0;
      const p2ShotsTx = latestStats['3002'] ?? 0;
      const p1ShotsOnTx = latestStats['3003'] ?? 0;
      const p2ShotsOnTx = latestStats['3004'] ?? 0;
      const p1FoulsTx = latestStats['3007'] ?? 0;
      const p2FoulsTx = latestStats['3008'] ?? 0;

      stats.shots.home = homeIsP1 ? p1ShotsTx : p2ShotsTx;
      stats.shots.away = homeIsP1 ? p2ShotsTx : p1ShotsTx;
      stats.shotsOnTarget.home = homeIsP1 ? p1ShotsOnTx : p2ShotsOnTx;
      stats.shotsOnTarget.away = homeIsP1 ? p2ShotsOnTx : p1ShotsOnTx;
      stats.fouls.home = homeIsP1 ? p1FoulsTx : p2FoulsTx;
      stats.fouls.away = homeIsP1 ? p2FoulsTx : p1FoulsTx;
    } else {
      // Fall back to counting events if no 3000-series stats
      stats.shots.home = homeIsP1 ? p1Shots : p2Shots;
      stats.shots.away = homeIsP1 ? p2Shots : p1Shots;
      stats.shotsOnTarget.home = homeIsP1 ? p1ShotsOn : p2ShotsOn;
      stats.shotsOnTarget.away = homeIsP1 ? p2ShotsOn : p1ShotsOn;
      stats.fouls.home = homeIsP1 ? p1Fouls : p2Fouls;
      stats.fouls.away = homeIsP1 ? p2Fouls : p1Fouls;
    }

    stats.dangerousAttacks.home = homeIsP1 ? p1DangerousAttacks : p2DangerousAttacks;
    stats.dangerousAttacks.away = homeIsP1 ? p2DangerousAttacks : p1DangerousAttacks;

    // Possession %: derive from last known possession holder
    // Since we only see momentary possession events (not a running %), we
    // count possession events per team as a proxy
    const totalPossessionEvents = events.filter(
      (e) => (this.getAction(e) === 'possession' || this.getAction(e) === 'safe_possession') &&
              e.Possession !== undefined
    ).length;

    if (totalPossessionEvents > 5) { // only use if we have enough data (more than 5 events)
      const p1PossEvents = events.filter(
        (e) => (this.getAction(e) === 'possession' || this.getAction(e) === 'safe_possession') &&
                e.Possession === 1
      ).length;
      const p1PossPct = Math.round((p1PossEvents / totalPossessionEvents) * 100);
      stats.possession.home = homeIsP1 ? p1PossPct : (100 - p1PossPct);
      stats.possession.away = homeIsP1 ? (100 - p1PossPct) : p1PossPct;
    } else { // default to 50/50 if we don't have enough data
      stats.possession.home = 50;
      stats.possession.away = 50;
    }

    return stats;
  }

  private static buildTimeline(events: TxScoreEvent[], homeIsP1: boolean): TimelineEvent[] {
    const relevant = new Set([
      'goal', 'yellow_card', 'red_card', 'penalty', 'substitution',
      'corner', 'status', 'additional_time',
    ]);

    return events
      .filter((e) => {
        const action = this.getAction(e);
        return action && relevant.has(action);
      })
      .map((e): TimelineEvent => {
        const action = this.getAction(e);
        const participant = this.getParticipant(e);
        const isP1 = participant === 1;
        const isHome = homeIsP1 ? isP1 : !isP1;
        const seconds = this.getClockSeconds(e);
        const statusId = this.getStatusId(e);
        const minute = this.clockToMinute(seconds, statusId);
        const ts = e.Ts ?? (typeof e.ts === 'number' ? e.ts : undefined);

        return {
          id: `${e.FixtureId}-${e.Seq ?? e.seq ?? e.Id ?? Math.random()}`,
          minute,
          type: this.actionToEventType(action),
          title: this.actionToLabel(action),
          description: e.player ?? this.actionToLabel(action),
          team: participant ? (isHome ? 'HOME' : 'AWAY') : 'NONE',
          player: e.player,
          timestamp: ts ? String(ts) : new Date().toISOString(),
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
      status: 'Status Update',
      additional_time: 'Additional Time',
    };
    return map[action] ?? action;
  }
}
