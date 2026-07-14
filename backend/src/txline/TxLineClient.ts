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
   */
  async getFixtures(competitionId?: number): Promise<TxFixture[]> {
    const params: Record<string, unknown> = {};
    if (competitionId !== undefined) params.competitionId = competitionId;
    const res = await this.client.get<TxFixture[]>('/api/fixtures/snapshot', { params });
    return res.data;
  }

  /**
   * GET /api/scores/snapshot/:fixtureId
   * Returns the full sequence of score events for a given fixture.
   */
  async getScoresSnapshot(fixtureId: number): Promise<TxScoreEvent[]> {
    const res = await this.client.get<TxScoreEvent[]>(`/api/scores/snapshot/${fixtureId}`);
    return res.data;
  }

  /**
   * GET /api/scores/updates/:fixtureId
   * Returns live score update events for an in-progress fixture.
   */
  async getScoresUpdates(fixtureId: number): Promise<TxScoreEvent[]> {
    const res = await this.client.get<TxScoreEvent[]>(`/api/scores/updates/${fixtureId}`);
    return res.data;
  }

  /**
   * GET /api/scores/historical/:fixtureId
   * Returns completed fixture score history (fixtures 6h–2 weeks old).
   */
  async getHistoricalScores(fixtureId: number): Promise<TxScoreEvent[]> {
    const res = await this.client.get<TxScoreEvent[]>(`/api/scores/historical/${fixtureId}`);
    return res.data;
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
  StartTime: string;           // ISO-8601
  Competition: string;
  CompetitionId: number;
  Participant1: string;        // team name
  Participant2: string;        // team name
  Participant1IsHome: boolean;
  GameState?: number;          // 1=scheduled, 6=cancelled
  Venue?: string;
  Stage?: string;
}

/**
 * A score event from /api/scores/snapshot or /api/scores/updates.
 * The `action` field identifies the event type (goal, yellow_card, etc.)
 * The `Data` field carries event-specific payload.
 */
export interface TxScoreEvent {
  FixtureId: number;
  seq: number;
  ts: string;                  // ISO-8601 timestamp
  gameState?: string;          // e.g. "H1", "H2", "HT", "F"
  action?: string;             // "goal", "yellow_card", "red_card", "substitution", "corner", "shot", "game_finalised", etc.
  period?: string;
  minute?: number;
  addedTime?: number;
  team?: 'Participant1' | 'Participant2';
  player?: string;
  Data?: Record<string, unknown>;
}

export const txLineClient = new TxLineClient();
