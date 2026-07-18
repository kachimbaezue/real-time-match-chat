# API Reference

Base URL (production): `https://real-time-match-chat.onrender.com`

All REST endpoints return JSON. No authentication required from the frontend — auth is internal between the backend and TxLINE.

---

## REST Endpoints

### `GET /health`

Health check. Returns 200 when the server is running.

**Response:**
```json
{ "status": "ok", "timestamp": "2026-07-18T12:00:00.000Z" }
```

---

### `GET /matches/live`

Returns all matches grouped by status. This is the primary endpoint — called on every page load.

**Response:**
```json
{
  "live": [Match],
  "upcoming": [Match],
  "recent": [Match]
}
```

**Match shape:**
```ts
interface Match {
  id: string;                     // TxLINE FixtureId as string
  home: { name: string; short: string; score: number };
  away: { name: string; short: string; score: number };
  status: "live" | "upcoming" | "finished";
  minute: number;                 // 0 if not started
  kickoff: string;                // human-readable e.g. "Today · 19:00"
  competition: string;            // "World Cup"
  stage: string;                  // "World Cup"
  venue: string;
  momentum: number;               // -100 to +100, positive = home team leading
  headline: string;               // AI-generated match pulse text
  pulse: string[];                // AI pulse sentences
  winProbability?: [number, number, number]; // [home%, draw%, away%]
  stats?: {
    possession: [number, number]; // [home%, away%]
    shots: [number, number];
    shotsOnTarget: [number, number];
    corners: [number, number];
    fouls: [number, number];
    xg: [number, number];         // expected goals
  };
  timeline?: TimelineEvent[];
  turningPoints?: string[];       // AI-generated, finished matches only
  recap?: string;                 // "If You Joined Now" text
}
```

---

### `GET /matches/:id`

Full match detail for a single fixture.

**Response:** `Match` object (same shape as above, fully populated)

**Error:** `404` if fixture ID not found in engine

---

### `GET /matches/:id/timeline`

Timeline events for a single match.

**Response:**
```json
{
  "matchId": "18241006",
  "timeline": [TimelineEvent]
}
```

```ts
interface TimelineEvent {
  id: string;
  minute: number;
  type: "GOAL" | "YELLOW_CARD" | "RED_CARD" | "PENALTY" | "SUBSTITUTION" | "CORNER" | "MATCH_STATUS";
  title: string;          // human label e.g. "Goal"
  description: string;
  team: "HOME" | "AWAY" | "NONE";
  player?: string;
  timestamp: string;      // ISO-8601
}
```

---

### `GET /matches/:id/stats`

Stats snapshot for a single match.

**Response:**
```json
{
  "matchId": "18241006",
  "stats": {
    "possession": [55, 45],
    "shots": [8, 3],
    "shotsOnTarget": [4, 1],
    "corners": [5, 2],
    "fouls": [10, 12],
    "xg": [1.8, 0.6]
  }
}
```

---

### `GET /matches/:id/momentum`

Current momentum score.

**Response:**
```json
{ "matchId": "18241006", "momentum": 32 }
```

---

### `GET /matches/:id/pulse`

AI-generated match pulse text.

**Response:**
```json
{ "matchId": "18241006", "pulse": "Argentina are pressing hard after their second goal, with England struggling to hold their shape in midfield." }
```

---

### `GET /matches/:id/recap`

"If You Joined Now" catch-up recap.

**Response:**
```json
{ "matchId": "18241006", "recap": "England took the lead before Argentina hit back with two second-half goals..." }
```

---

### `GET /matches/:id/probability`

Win probability breakdown.

**Response:**
```json
{ "matchId": "18241006", "winProbability": { "home": 22, "draw": 8, "away": 70 } }
```

---

### `GET /hot`

Live spaghetti thread — goals, cards, AI insights, stats highlights, and news, sorted by importance then recency.

**Response:**
```json
{
  "feed": [HotFeedItem],
  "total": 42
}
```

```ts
interface HotFeedItem {
  id: string;
  type: "goal" | "yellow_card" | "red_card" | "penalty" | "insight" | "stat" | "fulltime" | "status" | "news";
  importance: number;   // 1=low, 2=medium, 3=high
  text: string;         // AI-enriched or rule-based description
  minute: number;
  match?: {
    id: string; home: string; away: string;
    homeScore: number; awayScore: number;
    status: string; minute: number;
    competition: string; stage: string;
  };
  news?: {
    title: string; description: string | null; url: string;
    urlToImage: string | null; source: string; author: string | null;
  };
  ts: number;           // epoch ms — used for sorting
  detail?: string;      // player name if available
}
```

---

### `POST /ai/chat`

World Cup AI chat. Used by the Moments page "Ask AI" widget.

**Request:**
```json
{ "prompt": "What did Messi achieve at this World Cup?", "maxTokens": 150 }
```

**Response:**
```json
{ "text": "Messi became the all-time leading World Cup goalscorer at the 2026 tournament..." }
```

---

### `GET /matches/debug/snapshot` *(dev only)*

Returns raw engine state + TxLINE snapshot info. Useful for debugging.

**Response:**
```json
{
  "engineStats": {
    "total": 12,
    "live": 1,
    "upcoming": 2,
    "recent": 9
  },
  "snapshotFixtureCount": 11,
  "worldCupFixtures": 11,
  "finishedCount": 9,
  "liveCount": 1,
  "upcomingCount": 2,
  "sampleFinished": { ... }
}
```

---

## Socket.IO Events

Connect to `wss://real-time-match-chat.onrender.com` with `transports: ["websocket"]`.

All events carry a `matchId` field so the frontend can filter for the match it cares about.

### `scoreUpdated`

Fired when score or match minute changes.

```ts
{ matchId: string; homeScore: number; awayScore: number; minute: number }
```

### `statsUpdated`

Fired when possession, shots, corners, or xG changes.

```ts
{
  matchId: string;
  stats: {
    possession: [number, number];
    shots: [number, number];
    shotsOnTarget: [number, number];
    corners: [number, number];
    fouls: [number, number];
    xg: [number, number];
  }
}
```

### `timelineUpdated`

Fired when a new event (goal, card, corner, etc.) appears in the timeline.

```ts
{ matchId: string; event: TimelineEvent }
```

### `momentumUpdated`

Fired when the momentum score changes.

```ts
{ matchId: string; momentum: number }   // -100 to +100
```

### `matchPulseUpdated`

Fired when the AI generates a new match narrative (on score change or every 5 minutes).

```ts
{ matchId: string; pulse: string[]; headline: string }
```

### `winProbabilityUpdated`

Fired when the mathematical win probability model produces a new output.

```ts
{ matchId: string; winProbability: [number, number, number] }  // [home, draw, away]
```

### `matchFinished`

Fired when a live match transitions to FINISHED status.

```ts
{ matchId: string; homeScore: number; awayScore: number; turningPoints?: string[] }
```
