import axios from 'axios';
import { env } from '../config/env';

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export class NewsAPIClient {
  private readonly baseUrl = 'https://newsapi.org/v2';
  private readonly apiKey: string | null;

  constructor() {
    this.apiKey = env.NEWS_API_KEY || null;
  }

  async fetchWorldCupNews(): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      console.warn('⚠️ NEWS_API_KEY not set. Skipping news fetch.');
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/everything`, {
      params: {
        q: 'World Cup 2026',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 20,
        apiKey: this.apiKey,
      },
      });

      return response.data.articles || [];
    } catch (error) {
      console.error('❌ Failed to fetch news:', error);
      return [];
    }
  }
}

export const newsAPIClient = new NewsAPIClient();
