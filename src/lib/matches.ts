/**
 * Shared Match type used across frontend components and API layer.
 * All actual match data comes from the backend via /matches/live and /matches/:id.
 * There is NO static/demo data here.
 */

export type MatchStatus = "live" | "upcoming" | "finished";

export interface TimelineEvent {
  minute: number;
  type: "goal" | "yellow" | "red" | "sub" | "momentum" | "penalty" | "kickoff" | "halftime" | "fulltime";
  team?: "home" | "away";
  label: string;
  detail?: string;
}

export interface LineupPlayer {
  name: string;
  shortName: string;
  number: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  starter: boolean;
}

export interface Match {
  id: string;
  home: { name: string; short: string; score: number };
  away: { name: string; short: string; score: number };
  status: MatchStatus;
  minute?: number;
  kickoff?: string;
  competition: string;
  stage: string;
  venue?: string;
  momentum: number; // -100 (away) to 100 (home)
  headline: string;
  pulse: string[];
  joinedNow: string[];
  stats: {
    possession: [number, number];
    shots: [number, number];
    shotsOnTarget: [number, number];
    corners: [number, number];
    fouls: [number, number];
    xg: [number, number];
  };
  winProbability: [number, number, number] | null; // home, draw, away — null when not yet computed
  timeline: TimelineEvent[];
  turningPoints?: string[];
  lineups?: {
    home: LineupPlayer[];
    away: LineupPlayer[];
  };
}
