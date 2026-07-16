import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * TxLINE API client.
 *
 * Real API response format (from live data inspection):
 * - Fixtures: GameState is a number (1=scheduled, null=finished)
 * - Score events: use capital-case fields: Action, Participant (1|2), Clock.Seconds,
 *   StatusId (1=pre-match, 2=H1/H2 in-play, 3=HT), Score object with period breakdowns,
 *   Stats with numeric keys.
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
   * GameState=1 → scheduled, null/undefined → finished.
   */
  async getFixtures(competitionId?: number): Promise<TxFixture[]> {
    const params: Record<string, unknown> = {};
    if (competitionId !== undefined) params.competitionId = competitionId;
    const res = await this.client.get<unknown>('/api/fixtures/snapshot', { params });
    return this.asFixtureArray(res.data);
  }

  private asFixtureArray(data: unknown): TxFixture[] {
    if (Array.isArray(data)) return data as TxFixture[];
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.fixtures)) return obj.fixtures as TxFixture[];
      if (Array.isArray(obj.data)) return obj.data as TxFixture[];
    }
    return [];
  }

  private asEventArray(data: unknown): TxScoreEvent[] {
    if (Array.isArray(data)) return data as TxScoreEvent[];
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.events)) return obj.events as TxScoreEvent[];
      if (Array.isArray(obj.data)) return obj.data as TxScoreEvent[];
    }
    return [];
  }

  /**
   * GET /api/scores/snapshot/:fixtureId
   * Returns all events for a fixture (live or recently started).
   */
  async getScoresSnapshot(fixtureId: number): Promise<TxScoreEvent[]> {
    const res = await this.client.get<unknown>(`/api/scores/snapshot/${fixtureId}`);
    return this.asEventArray(res.data);
  }

  /**
   * GET /api/scores/updates/:fixtureId
   * Returns incremental live updates for an in-progress fixture.
   */
  async getScoresUpdates(fixtureId: number): Promise<TxScoreEvent[]> {
    const res = await this.client.get<unknown>(`/api/scores/updates/${fixtureId}`);
    return this.asEventArray(res.data);
  }

  /**
   * GET /api/scores/historical/:fixtureId
   * Returns completed fixture score history.
   */
  async getHistoricalScores(fixtureId: number): Promise<TxScoreEvent[]> {
    const res = await this.client.get<unknown>(`/api/scores/historical/${fixtureId}`);
    return this.asEventArray(res.data);
  }

  /**
   * Renew guest JWT.
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
  StartTime: string | number;   // ms timestamp
  Competition: string;
  CompetitionId: number;
  FixtureGroupId?: number;
  Participant1: string;
  Participant2: string;
  Participant1IsHome: boolean;
  /**
   * Fixture-level game state: 1=scheduled, null/undefined=finished.
   * NOTE: This field does NOT update to reflect live phase (H1/H2/HT).
   * Use score event StatusId to determine live phase.
   */
  GameState?: number | null;
  Venue?: string;
  Stage?: string;
}

/**
 * Real TxLINE score event shape (capital-case fields, as returned by the API).
 *
 * Key fields:
 *   Action    — event type: "goal", "yellow_card", "red_card", "corner", "shot",
 *               "kickoff", "status", "substitution", "injury", "free_kick", etc.
 *   Participant — 1 or 2 (which team)
 *   StatusId  — 1=pre-match, 2=in-play (H1 or H2), 3=half-time
 *   Clock     — { Running: bool, Seconds: number } — game clock in seconds
 *   Score     — { Participant1: { H1: {...}, HT: {...}, Total: {...} }, Participant2: {...} }
 *               Contains cumulative counts: Goals, YellowCards, RedCards, Corners, etc.
 *   Stats     — Record<string, number> with numeric keys encoding stats per team/period
 *   Data      — event-specific payload (e.g. { PlayerId, Outcome, Minutes })
 *   Seq       — sequence number for ordering
 *   Ts        — ms timestamp
 */
export interface TxScoreEvent {
  FixtureId: number;
  Action: string;
  Id: number;
  Seq: number;
  Ts: number;                    // ms timestamp
  StatusId?: number;             // 1=pre-match, 2=in-play, 3=HT
  Clock?: { Running: boolean; Seconds: number };
  Participant?: number;          // 1 or 2
  Possession?: number;           // 1 or 2
  Confirmed?: boolean;
  Score?: {
    Participant1?: TxPeriodScore;
    Participant2?: TxPeriodScore;
  };
  Stats?: Record<string, number>;
  Data?: Record<string, unknown>;
  Lineups?: unknown[];
  // legacy/ignored fields
  GameState?: string;
  StartTime?: number;
}

export interface TxPeriodScore {
  H1?: TxScoreCounts;
  HT?: TxScoreCounts;
  H2?: TxScoreCounts;
  Total?: TxScoreCounts;
}

export interface TxScoreCounts {
  Goals?: number;
  YellowCards?: number;
  RedCards?: number;
  Corners?: number;
  Penalties?: number;
}

export const txLineClient = new TxLineClient();
