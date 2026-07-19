/**
 * Match Memory store — saved to localStorage per wallet address or local ID
 */

const STORAGE_KEY = "pulse_memories";
const LOCAL_ID_KEY = "pulse_local_id";

/**
 * Get or create a stable anonymous local identity stored in localStorage.
 * Used as the identity key when no wallet is connected.
 */
export function getOrCreateLocalId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem(LOCAL_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LOCAL_ID_KEY, id);
  }
  return id;
}

export interface MatchMemory {
  id: string;                    // uuid
  matchId: string;               // TxLINE fixture ID
  walletAddress: string;
  savedAt: number;               // epoch ms
  txRef: string | null;          // blockchain tx ref placeholder

  // Match data snapshot
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  kickoffTime: string;
  winner: "home" | "away" | "draw";
  minute: number;

  // AI content
  pulse: string;                 // AI Match Pulse (first item)
  recap: string;                 // "If You Joined Now" (first item)
  turningPoints: string[];

  // Match detail
  timeline: any[];
  stats: any;
}

function loadAll(): MatchMemory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MatchMemory[];
  } catch {
    return [];
  }
}

function saveAll(memories: MatchMemory[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  } catch {
    // ignore storage errors
  }
}

/** Save a memory to localStorage */
export function saveMemory(memory: MatchMemory): void {
  const all = loadAll();
  // Replace if same id already exists, else append
  const idx = all.findIndex((m) => m.id === memory.id);
  if (idx >= 0) {
    all[idx] = memory;
  } else {
    all.push(memory);
  }
  saveAll(all);
}

/** Get all memories for a wallet address */
export function getMemories(walletAddress: string): MatchMemory[] {
  return loadAll().filter((m) => m.walletAddress === walletAddress);
}

/** Get a single memory by id */
export function getMemory(id: string): MatchMemory | null {
  return loadAll().find((m) => m.id === id) ?? null;
}

/** Delete a memory by id */
export function deleteMemory(id: string): void {
  const all = loadAll().filter((m) => m.id !== id);
  saveAll(all);
}

/** Build a MatchMemory from a Match object + wallet address + optional signature */
export function buildMemory(match: any, walletAddress: string, txRef: string | null = null): MatchMemory {
  const homeScore: number = match.home?.score ?? 0;
  const awayScore: number = match.away?.score ?? 0;

  let winner: "home" | "away" | "draw";
  if (homeScore > awayScore) winner = "home";
  else if (awayScore > homeScore) winner = "away";
  else winner = "draw";

  return {
    id: crypto.randomUUID(),
    matchId: match.id,
    walletAddress,
    savedAt: Date.now(),
    txRef,

    competition: match.competition ?? "",
    homeTeam: match.home?.name ?? "",
    awayTeam: match.away?.name ?? "",
    homeScore,
    awayScore,
    kickoffTime: match.kickoff ?? "",
    winner,
    minute: match.minute ?? 90,

    pulse: Array.isArray(match.pulse) ? (match.pulse[0] ?? "") : "",
    recap: Array.isArray(match.joinedNow) ? (match.joinedNow[0] ?? "") : "",
    turningPoints: Array.isArray(match.turningPoints) ? match.turningPoints : [],

    timeline: Array.isArray(match.timeline) ? match.timeline : [],
    stats: match.stats ?? null,
  };
}
