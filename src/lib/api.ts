/**
 * Pulse API client
 * Talks to the backend which normalizes TxLINE data into the Match shape.
 * Falls back gracefully if the backend is not reachable.
 */
import type { Match } from "@/lib/matches";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

export interface HomeMatches {
  live: Match[];
  upcoming: Match[];
  recent: Match[];
}

/** GET /matches/live — returns live, upcoming, and recent matches */
export async function fetchHomeMatches(): Promise<HomeMatches> {
  return get<HomeMatches>("/matches/live");
}

/** GET /matches/:id — full match detail */
export async function fetchMatch(id: string): Promise<Match> {
  return get<Match>(`/matches/${id}`);
}
export interface HotFeedItem {
  id: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'penalty' | 'insight' | 'stat' | 'status' | 'fulltime' | 'substitution' | 'corner';
  importance: number;
  text: string;
  emoji: string;
  minute: number;
  match: {
    id: string;
    home: string;
    away: string;
    homeScore: number;
    awayScore: number;
    status: string;
    minute: number;
    competition: string;
    stage: string;
  };
  ts: number;
  detail?: string;
}

export async function fetchHotFeed(): Promise<HotFeedItem[]> {
  const data = await get<{ feed: HotFeedItem[]; total: number }>('/hot');
  return data.feed ?? [];
}
