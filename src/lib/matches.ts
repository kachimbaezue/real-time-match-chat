export type MatchStatus = "live" | "upcoming" | "finished";

export interface TimelineEvent {
  minute: number;
  type: "goal" | "yellow" | "red" | "sub" | "momentum" | "penalty" | "kickoff" | "halftime" | "fulltime";
  team?: "home" | "away";
  label: string;
  detail?: string;
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
  winProbability: [number, number, number]; // home, draw, away
  timeline: TimelineEvent[];
  // For finished matches — narrative turning points
  turningPoints?: string[];
}

export const matches: Match[] = [
  // ─── LIVE ────────────────────────────────────────────────────────
  {
    id: "arg-bra",
    home: { name: "Argentina", short: "ARG", score: 2 },
    away: { name: "Brazil", short: "BRA", score: 1 },
    status: "live",
    minute: 74,
    competition: "FIFA World Cup 2026",
    stage: "Semi-final",
    venue: "MetLife Stadium, New York",
    momentum: 62,
    headline: "Argentina are taking complete control after Brazil's red card.",
    pulse: [
      "Argentina have controlled possession for the last twelve minutes.",
      "Brazil have failed to register a shot during that period.",
      "Another goal feels increasingly likely with Argentina pressing high.",
    ],
    joinedNow: [
      "Brazil opened the scoring in the 14th minute after an early defensive mistake.",
      "Argentina equalised through Messi just before halftime.",
      "A red card to Casemiro in the 68th minute shifted the rhythm entirely.",
      "Argentina scored the go-ahead goal moments later and have dominated since.",
    ],
    stats: {
      possession: [61, 39],
      shots: [14, 8],
      shotsOnTarget: [6, 2],
      corners: [7, 3],
      fouls: [9, 14],
      xg: [2.1, 0.8],
    },
    winProbability: [71, 18, 11],
    timeline: [
      { minute: 74, type: "goal", team: "home", label: "Goal", detail: "Álvarez" },
      { minute: 68, type: "red", team: "away", label: "Red Card", detail: "Casemiro" },
      { minute: 59, type: "momentum", team: "home", label: "Momentum Shift" },
      { minute: 46, type: "kickoff", label: "Second half" },
      { minute: 45, type: "halftime", label: "Half-time" },
      { minute: 44, type: "goal", team: "home", label: "Goal", detail: "Messi" },
      { minute: 32, type: "yellow", team: "away", label: "Yellow Card", detail: "Militão" },
      { minute: 14, type: "goal", team: "away", label: "Goal", detail: "Vinicius Jr." },
      { minute: 0, type: "kickoff", label: "Kick-off" },
    ],
  },
  {
    id: "esp-fra",
    home: { name: "Spain", short: "ESP", score: 1 },
    away: { name: "France", short: "FRA", score: 1 },
    status: "live",
    minute: 56,
    competition: "FIFA World Cup 2026",
    stage: "Semi-final",
    venue: "AT&T Stadium, Dallas",
    momentum: 4,
    headline: "The game is finely balanced with neither side dominant.",
    pulse: [
      "Spain and France have traded chances across the second half.",
      "Possession has been evenly split since the equaliser.",
      "The next goal likely decides the tie.",
    ],
    joinedNow: [
      "France opened the scoring midway through the first half through Mbappé.",
      "Spain equalised early in the second half via Pedri.",
      "Both teams have looked capable of scoring again.",
    ],
    stats: {
      possession: [52, 48],
      shots: [9, 10],
      shotsOnTarget: [4, 4],
      corners: [4, 5],
      fouls: [7, 8],
      xg: [1.3, 1.4],
    },
    winProbability: [34, 32, 34],
    timeline: [
      { minute: 52, type: "goal", team: "home", label: "Goal", detail: "Pedri" },
      { minute: 46, type: "kickoff", label: "Second half" },
      { minute: 45, type: "halftime", label: "Half-time" },
      { minute: 28, type: "goal", team: "away", label: "Goal", detail: "Mbappé" },
      { minute: 0, type: "kickoff", label: "Kick-off" },
    ],
  },
  {
    id: "eng-ger",
    home: { name: "England", short: "ENG", score: 0 },
    away: { name: "Germany", short: "GER", score: 0 },
    status: "live",
    minute: 18,
    competition: "FIFA World Cup 2026",
    stage: "Quarter-final",
    venue: "SoFi Stadium, Los Angeles",
    momentum: -18,
    headline: "Germany are settling into a controlled rhythm early.",
    pulse: [
      "Germany have kept the ball in England's half for extended spells.",
      "England are yet to find a shooting opportunity of note.",
    ],
    joinedNow: [
      "Both teams started cautiously.",
      "Germany have gradually taken the initiative in possession.",
    ],
    stats: {
      possession: [44, 56],
      shots: [1, 3],
      shotsOnTarget: [0, 1],
      corners: [0, 2],
      fouls: [3, 2],
      xg: [0.1, 0.4],
    },
    winProbability: [30, 42, 28],
    timeline: [
      { minute: 12, type: "yellow", team: "home", label: "Yellow Card", detail: "Rice" },
      { minute: 0, type: "kickoff", label: "Kick-off" },
    ],
  },

  // ─── UPCOMING ────────────────────────────────────────────────────
  {
    id: "por-ned",
    home: { name: "Portugal", short: "POR", score: 0 },
    away: { name: "Netherlands", short: "NED", score: 0 },
    status: "upcoming",
    kickoff: "Today · 20:00",
    competition: "FIFA World Cup 2026",
    stage: "Quarter-final",
    venue: "Levi's Stadium, San Francisco",
    momentum: 0,
    headline: "",
    pulse: [],
    joinedNow: [],
    stats: {
      possession: [0, 0],
      shots: [0, 0],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      fouls: [0, 0],
      xg: [0, 0],
    },
    winProbability: [38, 30, 32],
    timeline: [],
  },
  {
    id: "ita-bel",
    home: { name: "Italy", short: "ITA", score: 0 },
    away: { name: "Belgium", short: "BEL", score: 0 },
    status: "upcoming",
    kickoff: "Tomorrow · 17:00",
    competition: "FIFA World Cup 2026",
    stage: "Quarter-final",
    venue: "Arrowhead Stadium, Kansas City",
    momentum: 0,
    headline: "",
    pulse: [],
    joinedNow: [],
    stats: {
      possession: [0, 0],
      shots: [0, 0],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      fouls: [0, 0],
      xg: [0, 0],
    },
    winProbability: [42, 28, 30],
    timeline: [],
  },

  // ─── RECENT / FINISHED ───────────────────────────────────────────
  {
    id: "usa-mex",
    home: { name: "USA", short: "USA", score: 2 },
    away: { name: "Mexico", short: "MEX", score: 1 },
    status: "finished",
    kickoff: "Jul 10 · 21:00",
    competition: "FIFA World Cup 2026",
    stage: "Round of 16",
    venue: "AT&T Stadium, Dallas",
    momentum: 30,
    headline: "USA survive a late Mexico fightback to book their quarter-final place.",
    pulse: [
      "USA controlled the first half with aggressive pressing.",
      "Mexico's substitutions changed the momentum completely in the second half.",
      "Pulisic's brace proved the difference in a pulsating Derby of the Americas.",
    ],
    joinedNow: [
      "USA went ahead on 22 minutes through Pulisic.",
      "A second goal from Weah on 49 minutes appeared to settle the tie.",
      "Mexico pulled one back through Lozano in the 78th minute.",
      "USA held on despite intense pressure in the final ten minutes.",
    ],
    turningPoints: [
      "Pulisic's opening goal silenced the partisan crowd and gave USA early control.",
      "Mexico's double substitution at halftime injected pace and forced USA back.",
      "Lozano's goal set up a frantic finish but USA's defensive discipline held.",
    ],
    stats: {
      possession: [48, 52],
      shots: [12, 16],
      shotsOnTarget: [5, 6],
      corners: [5, 7],
      fouls: [11, 13],
      xg: [1.8, 1.6],
    },
    winProbability: [52, 26, 22],
    timeline: [
      { minute: 90, type: "fulltime", label: "Full-time" },
      { minute: 78, type: "goal", team: "away", label: "Goal", detail: "Lozano" },
      { minute: 67, type: "yellow", team: "away", label: "Yellow Card", detail: "Guardado" },
      { minute: 49, type: "goal", team: "home", label: "Goal", detail: "Weah" },
      { minute: 46, type: "kickoff", label: "Second half" },
      { minute: 45, type: "halftime", label: "Half-time" },
      { minute: 22, type: "goal", team: "home", label: "Goal", detail: "Pulisic" },
      { minute: 0, type: "kickoff", label: "Kick-off" },
    ],
  },
  {
    id: "fra-ita",
    home: { name: "France", short: "FRA", score: 3 },
    away: { name: "Italy", short: "ITA", score: 2 },
    status: "finished",
    kickoff: "Jul 9 · 19:00",
    competition: "FIFA World Cup 2026",
    stage: "Round of 16",
    venue: "Levi's Stadium, San Francisco",
    momentum: 20,
    headline: "Mbappé hat-trick fires France into the quarter-finals in a World Cup classic.",
    pulse: [
      "France's speed on the counter was Italy's greatest challenge throughout.",
      "Mbappé was unplayable in the final third, creating or scoring every France goal.",
      "Italy's pressing game created chances but poor finishing proved costly.",
    ],
    joinedNow: [
      "Italy opened the scoring on 11 minutes with a free-kick from Verratti.",
      "Mbappé equalised within three minutes.",
      "France led 2–1 at half-time through a Griezmann header.",
      "Italy equalised on 60 minutes but Mbappé completed his hat-trick on 81.",
    ],
    turningPoints: [
      "Italy's early free-kick goal threatened to let them sit back and absorb pressure.",
      "Mbappé's rapid equaliser changed the psychological dynamic entirely.",
      "Italy's 60th-minute goal forced France to attack, opening space for the winner.",
    ],
    stats: {
      possession: [54, 46],
      shots: [18, 14],
      shotsOnTarget: [8, 5],
      corners: [6, 4],
      fouls: [10, 14],
      xg: [2.9, 1.8],
    },
    winProbability: [58, 22, 20],
    timeline: [
      { minute: 90, type: "fulltime", label: "Full-time" },
      { minute: 81, type: "goal", team: "home", label: "Goal", detail: "Mbappé (hat-trick)" },
      { minute: 60, type: "goal", team: "away", label: "Goal", detail: "Barella" },
      { minute: 46, type: "kickoff", label: "Second half" },
      { minute: 45, type: "halftime", label: "Half-time" },
      { minute: 38, type: "goal", team: "home", label: "Goal", detail: "Griezmann" },
      { minute: 14, type: "goal", team: "home", label: "Goal", detail: "Mbappé" },
      { minute: 11, type: "goal", team: "away", label: "Goal", detail: "Verratti" },
      { minute: 0, type: "kickoff", label: "Kick-off" },
    ],
  },
  {
    id: "bra-arg-r16",
    home: { name: "Brazil", short: "BRA", score: 1 },
    away: { name: "Argentina", short: "ARG", score: 1 },
    status: "finished",
    kickoff: "Jul 8 · 21:00",
    competition: "FIFA World Cup 2026",
    stage: "Round of 16",
    venue: "MetLife Stadium, New York",
    momentum: 10,
    headline: "Argentina advance on penalties after the classic South American showdown ends level.",
    pulse: [
      "Both teams cancelled each other out across 90 intense minutes.",
      "Extra time produced few chances as fatigue became a factor.",
      "Argentina's goalkeeper was the hero in the penalty shootout.",
    ],
    joinedNow: [
      "Brazil scored through Rodrygo on 33 minutes.",
      "Messi's equaliser on 67 minutes sent the game to extra time.",
      "No goals in extra time. Argentina win 4–3 on penalties.",
    ],
    turningPoints: [
      "Rodrygo's first-half goal gave Brazil a platform to defend.",
      "Messi's pin-point free-kick equaliser was the defining moment of the match.",
      "Argentina's goalkeeper saved two penalties to send his side through.",
    ],
    stats: {
      possession: [50, 50],
      shots: [11, 13],
      shotsOnTarget: [4, 5],
      corners: [5, 6],
      fouls: [16, 12],
      xg: [1.2, 1.5],
    },
    winProbability: [50, 0, 50],
    timeline: [
      { minute: 120, type: "fulltime", label: "Penalties" },
      { minute: 105, type: "kickoff", label: "Extra time 2nd half" },
      { minute: 90, type: "kickoff", label: "Extra time" },
      { minute: 67, type: "goal", team: "away", label: "Goal", detail: "Messi (free-kick)" },
      { minute: 46, type: "kickoff", label: "Second half" },
      { minute: 45, type: "halftime", label: "Half-time" },
      { minute: 33, type: "goal", team: "home", label: "Goal", detail: "Rodrygo" },
      { minute: 0, type: "kickoff", label: "Kick-off" },
    ],
  },
];

export const getMatch = (id: string) => matches.find((m) => m.id === id);

export const getLiveMatches = () => matches.filter((m) => m.status === "live");
export const getUpcomingMatches = () => matches.filter((m) => m.status === "upcoming");
export const getRecentMatches = () => matches.filter((m) => m.status === "finished");
