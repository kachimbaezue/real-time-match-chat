import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class TxLineClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.TXLINE_BASE_URL,
      headers: {
        'Authorization': `Bearer ${env.TXLINE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add interceptors for retries and error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        logger.error(`TxLine API Error: ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetches the latest live match data from TxLINE.
   * Note: Replace '/api/v1/live' with the actual TxLINE endpoint.
   */
  async getLiveMatches(): Promise<any> {
    try {
      const response = await this.client.get('/api/v1/live');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch live matches from TxLINE', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetches events/timeline for a specific match.
   */
  async getMatchEvents(matchId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/v1/matches/${matchId}/events`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch events for match ${matchId}`, { error: error.message });
      throw error;
    }
  }
}

export const txLineClient = new TxLineClient();
