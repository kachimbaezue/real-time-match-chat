/**
 * Frontend API client — talks to our Express backend which proxies TxLine data.
 * Falls back to the static match data when the backend is unavailable.
 */

export const BACKEND_URL =
  typeof window !== "undefined"
    ? (import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001")
    : "http://localhost:3001";

export async function fetchLiveMatches() {
  const res = await fetch(`${BACKEND_URL}/matches/live`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchMatchById(id: string) {
  const res = await fetch(`${BACKEND_URL}/matches/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
