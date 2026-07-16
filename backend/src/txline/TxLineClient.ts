import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * TxLINE API client.
 *
 * Auth: every request needs both headers:
 *   Authorization: Bearer <jwt>       ← guest JWT from /auth/guest/start
 *   X-Api-Token: <apiToken>           ← activated API token
 *
 * The JWT expires every 30 days. The API token lives as long as the subscription.
 */
export class TxLineClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.TXLINE_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.TXLINE_JWT}`,
        'X-Api-Token': env.TXLINE_API_KEY,
      },
    });

    this.client.interceptors.response.use(
      (r) => r,
      (err) => {
        logger.error(`TxLINE API error: ${err.response?.status} ${err.message}`);
        return Promise.reject(err);
      }
    );
  }

  /**
   * GET /api/fixtures/snapshot
   * Returns all fixtures the subscription covers.
   * GameState=1 → scheduled, GameState=6 → cancelled.
   * No GameState (undefined/null) → finished.
   */
  async getFixtures(competitionId?: number): Promise<TxFixture[]> {
    const params: Record<string, unknown> = {};
    if (competitionId !== undefined) params.competitionId = competitionId;
    const res = await this.client.get<TxFixture[]>('/api/fixtures/snapshot', { params });
    return this.asFixtureArray(res.data);
  }

  private asFixtureArray(data: unknown): TxFixture[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.fixtures)) return obj.fixtures as TxFixture[];
      if (Array.isArray(obj.data)) return obj.data as TxFixture[];
    }
    return [];
  }

  private asScoreArray(data: unknown): TxScoreEvent[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.events)) return obj.events as TxScoreEvent[];
      if (Array.isArray(obj.data)) return obj.data as TxScoreEvent[];
    }
    return [];
  }

  /**
   * GET /api/scores/snapshot/:fixtureId
   * Returns the full sequence of score events for a given fixture.
   */
  async getScoresSnapshot(fixtureId: number): Promise<TxScoreEvent[]> {
    const res = await this.client.get<TxScoreEvent[]>(`/api/scores/snapshot/${fixtureId}`);
    return this.asScoreArray(res.data);
  }

  /**
   * GET /api/scores/updates/:fixtureId
   * Returns live score update events for an in-progress fixture.
   */
  async getScoresUpdates(fixtureId: number): Promise<TxScoreEvent[]> {
    const res = await this.client.get<TxScoreEvent[]>(`/api/scores/updates/${fixtureId}`);
    return this.asScoreArray(res.data);
  }

  /**
   * GET /api/scores/historical/:fixtureId
   * Returns completed fixture score history (fixtures 6h–2 weeks old).
   */
  async getHistoricalScores(fixtureId: number): Promise<TxScoreEvent[]> {
    const res = await this.client.get<TxScoreEvent[]>(`/api/scores/historical/${fixtureId}`);
    return this.asScoreArray(res.data);
  }

  /**
   * Renew guest JWT.  Call POST /auth/guest/start — no auth required.
   */
  async renewJwt(): Promise<string> {
    const res = await axios.post<{ token: string }>(
      `${env.TXLINE_BASE_URL}/auth/guest/start`
    );
    return res.data.token;
  }
}

// ── TxLINE response shapes ─────────────────────────────────────────────────

/** A fixture from /api/fixtures/snapshot */
export interface TxFixture {
  FixtureId: number;
  StartTime: string | number;      // ISO-8601 or ms timestamp
  Competition: string;
  CompetitionId: number;
  FixtureGroupId?: number;
  Participant1: string;        // team name (or ID — may need lookup)
  Participant2: string;        // team name (or ID — may need lookup)
  Participant1Id?: number;
  Participant2Id?: number;
  Participant1IsHome: boolean;
  GameState?: number | null;   // 1=scheduled, 2=H1, 3=HT, 4=H2, 5=F, null=finished, 6=cancelled
  Venue?: string;
  Stage?: string;
}

/**
 * Raw score event from /api/scores/snapshot or /api/scores/updates.
 *
 * TxLINE sends PascalCase. Key fields confirmed from live API output:
 *   Action     — event type: "goal", "yellow_card", "red_card", "shot", "corner",
 *                "possession", "safe_possession", "attack_possession",
 *                "high_danger_possession", "danger_possession",
 *                "throw_in", "free_kick", "goal_kick", "injury",
 *                "status", "standby", "kickoff", "additional_time", …
 *   StatusId   — match phase: 1=pre-match, 2=H1, 3=HT, 4=H2, 5=FT,
 *                7=ET1, 8=HTET, 9=ET2, 10=FET, 11=WPE, 12=PE, 13=FPE
 *   Clock      — { Running: bool, Seconds: number }
 *   Stats      — flat numeric-keyed object (see MatchNormalizer for key map)
 *                Confirmed stat keys from live data:
 *                  1=P1 goals, 2=P2 goals
 *                  3=P1 yellow cards, 4=P2 yellow cards (inferred)
 *                  5=P1 red cards,   6=P2 red cards
 *                  7=P1 corners,     8=P2 corners
 *                  1001..=H1 variants of above
 *                  2001..=H2 variants
 *   Score      — cumulative score object present on card/corner events:
 *                { Participant1: { H1, HT, Total: { Goals, YellowCards, Corners, … } },
 *                  Participant2: … }
 *   Data       — event-specific payload, e.g.:
 *                shot:        { Outcome: "OnTarget"|"OffTarget"|"Blocked" }
 *                yellow_card: { PlayerId: number }
 *                status:      { StatusId: number }
 *                kickoff:     { Team: 1|2 }
 *                venue:       { Type: "neutral"|"home" }
 *   Participant — 1 | 2 — which team performed the action
 *   Possession  — 1 | 2 — which team has the ball (on possession events)
 *   Ts          — epoch ms timestamp
 *   Seq         — sequence number (monotonically increasing per fixture)
 *   Id          — unique event ID
 */
export interface TxScoreEvent {
  FixtureId: number;
  Id?: number;
  Seq?: number;
  Ts?: number;                   // epoch ms
  Action?: string;               // PascalCase-style but lowercase value: "goal", "yellow_card", …
  StatusId?: number;             // phase: 1=pre, 2=H1, 3=HT, 4=H2, 5=FT, …
  GameState?: string | number;   // may appear as "scheduled" string or phase number
  Clock?: { Running: boolean; Seconds: number };
  Stats?: Record<string, number>;
  Score?: {
    Participant1?: {
      H1?:    Record<string, number>;
      HT?:    Record<string, number>;
      H2?:    Record<string, number>;
      Total?: Record<string, number>;
    };
    Participant2?: {
      H1?:    Record<string, number>;
      HT?:    Record<string, number>;
      H2?:    Record<string, number>;
      Total?: Record<string, number>;
    };
  };
  Data?: Record<string, unknown>;
  Participant?: 1 | 2;           // which team did this action
  Possession?: 1 | 2;           // which team has ball (possession events)
  PossessionType?: string;       // "SafePossession" | "AttackPossession" | etc.
  Confirmed?: boolean;

  // ── legacy camelCase aliases (kept for any older serialized data) ──
  seq?: number;
  ts?: string | number;
  gameState?: string | number;
  action?: string;
  minute?: number;
  team?: 'Participant1' | 'Participant2';
  player?: string;
}

export const txLineClient = new TxLineClient();
