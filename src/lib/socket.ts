/**
 * Pulse Socket client
 * Singleton socket.io connection to the backend.
 * Components subscribe to match-specific events and clean up on unmount.
 *
 * socket.io-client is loaded lazily via dynamic import so it never executes
 * during SSR (Node.js), which would hang the process.
 */
import type { Socket } from "socket.io-client";
import type { Match, TimelineEvent } from "@/lib/matches";

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? "http://localhost:3001";

// Lazy singleton — only connects in the browser, never during SSR
let _socket: Socket | null = null;

export async function getSocketAsync(): Promise<Socket> {
  if (typeof window === "undefined") {
    throw new Error("Socket not available on server");
  }
  if (!_socket) {
    const { io } = await import("socket.io-client");
    _socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }
  return _socket;
}

// ── Typed event payloads ──────────────────────────────────────────────────────

export interface ScoreUpdatedPayload {
  matchId: string;
  homeScore: number;
  awayScore: number;
  minute: number;
}

export interface StatsUpdatedPayload {
  matchId: string;
  stats: Match["stats"];
}

export interface TimelineUpdatedPayload {
  matchId: string;
  event: TimelineEvent;
}

export interface MomentumUpdatedPayload {
  matchId: string;
  momentum: number; // -100 to 100
}

export interface MatchPulseUpdatedPayload {
  matchId: string;
  pulse: string[];
  headline: string;
}

export interface WinProbabilityUpdatedPayload {
  matchId: string;
  winProbability: [number, number, number];
}

export interface JoinedNowUpdatedPayload {
  matchId: string;
  joinedNow: string[];
}

export interface MatchFinishedPayload {
  matchId: string;
  homeScore: number;
  awayScore: number;
  turningPoints?: string[];
}

// ── Subscribe helpers — returns an unsubscribe function ───────────────────────
// Each helper is safe to call during SSR — it returns a no-op cleanup if
// the socket isn't available (e.g. server environment).

function safeOn<T>(event: string, cb: (p: T) => void): () => void {
  if (typeof window === "undefined") return () => {};
  let unsub = () => {};
  getSocketAsync().then((s) => {
    s.on(event, cb);
    unsub = () => s.off(event, cb);
  }).catch(() => {});
  return () => unsub();
}

export function onScoreUpdated(cb: (p: ScoreUpdatedPayload) => void) {
  return safeOn<ScoreUpdatedPayload>("scoreUpdated", cb);
}

export function onStatsUpdated(cb: (p: StatsUpdatedPayload) => void) {
  return safeOn<StatsUpdatedPayload>("statsUpdated", cb);
}

export function onTimelineUpdated(cb: (p: TimelineUpdatedPayload) => void) {
  return safeOn<TimelineUpdatedPayload>("timelineUpdated", cb);
}

export function onMomentumUpdated(cb: (p: MomentumUpdatedPayload) => void) {
  return safeOn<MomentumUpdatedPayload>("momentumUpdated", cb);
}

export function onMatchPulseUpdated(cb: (p: MatchPulseUpdatedPayload) => void) {
  return safeOn<MatchPulseUpdatedPayload>("matchPulseUpdated", cb);
}

export function onWinProbabilityUpdated(cb: (p: WinProbabilityUpdatedPayload) => void) {
  return safeOn<WinProbabilityUpdatedPayload>("winProbabilityUpdated", cb);
}

export function onJoinedNowUpdated(cb: (p: JoinedNowUpdatedPayload) => void) {
  return safeOn<JoinedNowUpdatedPayload>("joinedNowUpdated", cb);
}

export function onMatchFinished(cb: (p: MatchFinishedPayload) => void) {
  return safeOn<MatchFinishedPayload>("matchFinished", cb);
}
