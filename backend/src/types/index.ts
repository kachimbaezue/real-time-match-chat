export type MatchStatus = 'NOT_STARTED' | 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'EXTRA_TIME' | 'PENALTIES' | 'FINISHED' | 'SUSPENDED';

export type EventType = 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'PENALTY' | 'SUBSTITUTION' | 'CORNER' | 'MATCH_STATUS' | 'ODDS_MOVEMENT' | 'STATISTICS';

export interface TimelineEvent {
  id: string;
  minute: number;
  type: EventType;
  title: string;
  description: string;
  team?: 'HOME' | 'AWAY' | 'NONE';
  player?: string;
  timestamp: string;
}

export interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  expectedGoals: { home: number; away: number };
  passAccuracy: { home: number; away: number };
  dangerousAttacks: { home: number; away: number };
}

export type MomentumState = 'Home' | 'Away' | 'Balanced';

export interface MatchMomentum {
  state: MomentumState;
  score: number; // e.g., -100 to 100 where negative is away, positive is home
}

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface LineupPlayer {
  id: number;             // fixturePlayerId
  normativeId: number;    // used to match against goal/card event Data.PlayerId
  name: string;           // preferredName — "Messi, Lionel"
  shortName: string;      // last name or short form — "Messi"
  number: string;         // shirt number
  position: PlayerPosition;
  starter: boolean;
}

export interface MatchLineups {
  home: LineupPlayer[];
  away: LineupPlayer[];
}

export interface MatchState {
  id: string;
  homeTeam: string;
  awayTeam: string;
  score: { home: number; away: number };
  minute: number;
  status: MatchStatus;
  competition: string;
  venue: string;
  kickoffTime: string;
  stats: MatchStats;
  timeline: TimelineEvent[];
  momentum: MatchMomentum;
  lineups?: MatchLineups;
  pulse?: string;
  recap?: string;
  winProbability?: { home: number; draw: number; away: number };
  turningPoints?: string[];
}
