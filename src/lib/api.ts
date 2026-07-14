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
  const res = await fetch(`${BASE_URL}/matches/${id}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (res.status === 404) throw new Error(`Match ${id} not found`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<Match>;
}
