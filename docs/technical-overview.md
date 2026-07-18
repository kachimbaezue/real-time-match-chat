# Pulse — Technical Overview

> Real-time football match intelligence platform powered by TxLINE data, AI commentary, and WebSocket delivery.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend](#backend)
   - [Server & Entry Point](#server--entry-point)
   - [TxLINE Integration](#txline-integration)
   - [Match Engine](#match-engine)
   - [Match Normalizer](#match-normalizer)
   - [Momentum Engine](#momentum-engine)
   - [AI Service](#ai-service)
   - [Socket Service](#socket-service)
   - [HTTP API Routes](#http-api-routes)
   - [Hot Feed](#hot-feed)
3. [Frontend](#frontend)
   - [Routing](#routing)
   - [Pages](#pages)
   - [API Client](#api-client)
   - [Real-time Updates](#real-time-updates)
4. [Data Flow](#data-flow)
5. [Match Status State Machine](#match-status-state-machine)
6. [Environment Variables](#environment-variables)
7. [Known Gotchas & Fixes](#known-gotchas--fixes)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React)               │
│   /live  /hot  / (home)  /match/:id                         │
│   fetchHomeMatches()  fetchHotFeed()  fetchMatch()           │
│   Socket.IO client ── scoreUpdated, timelineUpdated, …       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP + WebSocket
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node + Express)                   │
│                                                             │
│  Express routes                                             │
│    GET /matches/live    → MatchController.getLiveMatches     │
│    GET /matches/:id     → MatchController.getMatchById       │
│    GET /hot             → hotRoutes                          │
│    GET /ai/*            → aiRoutes (Groq)                    │
│                                                             │
│  MatchEngine (singleton)                                    │
│    └─ in-memory Map<id, MatchState>                         │
│    └─ polls TxLINE every 30s (full snapshot)                │
│    └─ fast-polls live matches every 10s                     │
│                                                             │
│  MatchNormalizer  →  converts raw TxLINE events to          │
│                      MatchState (score, status, timeline)    │
│                                                             │
│  Socket.IO server  →  broadcasts score/timeline diffs        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
         TxLINE API  (fixtures/snapshot, scores/snapshot,
                      scores/updates, scores/historical)
```

---

## Backend

### Server & Entry Point

**File:** `backend/src/server.ts`

- Creates an Express app and attaches Socket.IO.
- Registers all route groups under their prefixes.
- Calls `matchEngine.startPolling()` on boot — begins the 30s fixture poll and 10s live poll.
- Serves a simple `GET /health` for uptime checks.

### TxLINE Integration

**File:** `backend/src/txline/TxLineClient.ts`

Thin Axios wrapper around the TxLINE REST API.

| Method | TxLINE Endpoint | Purpose |
|---|---|---|
| `getFixtures(competitionId?)` | `GET /api/fixtures/snapshot` | All fixtures the subscription covers. `GameState` field indicates phase. |
| `getScoresSnapshot(fixtureId)` | `GET /api/scores/snapshot/:id` | Full event log for a fixture (live + past events). Always authoritative. |
| `getScoresUpdates(fixtureId)` | `GET /api/scores/updates/:id` | Incremental events since last poll (not currently used in hot path). |
| `getHistoricalScores(fixtureId)` | `GET /api/scores/historical/:id` | Completed fixture history (6h–2 weeks old). |

**Auth headers on every request:**
- `Authorization: Bearer <TXLINE_JWT>` — guest JWT, expires every 30 days.
- `X-Api-Token: <TXLINE_API_KEY>` — persistent subscription token.

#### TxLINE GameState values (fixture-level)

| Value | Meaning |
|---|---|
| `1` | Scheduled / not started |
| `2` | First half |
| `3` | Half time |
| `4` | Second half |
| `5` | Full time |
| `6` | Cancelled |
| `null` / `undefined` | **Ambiguous** — historically meant "finished" but TxLINE sometimes sends null for live matches whose fixture record has not been updated yet |

#### TxLINE StatusId values (event-level — always authoritative)

| StatusId | Meaning |
|---|---|
| `1` | Pre-match |
| `2` | First half |
| `3` | Half time |
| `4` | Second half |
| `5` | Full time |
| `7` | Extra time 1st half |
| `8` | Half time extra time |
| `9` | Extra time 2nd half |
| `10` | Full time after extra time |
| `11` | Before penalties |
| `12` | Penalties |
| `13` | Full time after penalties |
| `100` | Game finalised (confirmed from live data) |

---

### Match Engine

**File:** `backend/src/services/MatchEngine.ts`

Singleton that owns all match state and drives all polling.

#### Startup sequence

1. `startPolling()` — guards against double-start, checks for TxLINE credentials.
2. `bootstrapHistorical()` — loads the full fixture snapshot, splits fixtures into `finished / live / upcoming / ambiguous`, calls `syncFixture()` for all of them.
3. Optionally `bootstrapKnownFinished()` — hardcoded list of fixtures that have dropped off the snapshot (used in mainnet WC mode when `TXLINE_WC_COMPETITION_ID` is set).
4. `setInterval(tick, 30_000)` — full snapshot refresh, discovers new matches and phase changes.
5. `setInterval(tickLive, 10_000)` — fast re-sync for all currently-live matches via `getScoresSnapshot`.

#### Key methods

| Method | Returns |
|---|---|
| `getLiveMatches()` | Matches with status in `FIRST_HALF \| HALF_TIME \| SECOND_HALF \| EXTRA_TIME \| PENALTIES` |
| `getUpcomingMatches()` | Matches with status `NOT_STARTED` |
| `getRecentMatches()` | Matches with status `FINISHED`, sorted newest first |
| `getAllMatches()` | Every match in the in-memory map |
| `getMatch(id)` | Single match by string fixture ID |

#### `syncFixture(fixture)`

1. Skip if already known-finished in memory.
2. Determine whether to call `getScoresSnapshot` (live/ambiguous) or `getHistoricalScores` (confirmed finished). **Important:** `null` GameState now always routes to `getScoresSnapshot` — the event StatusIds are trusted over the fixture-level field.
3. Call `MatchNormalizer.normalize(fixture, events)`.
4. Diff against previous state and call `broadcastDiffs()`.
5. Trigger AI generation if score changed or every 5 minutes.

#### World Cup filter

Fixtures are filtered to World Cup only using:
- `CompetitionId === TXLINE_WC_COMPETITION_ID` (if env var is set), or
- Competition name contains "world cup", or
- Kickoff date falls within the WC 2026 window (Jun 11 – Jul 19, 2026, with buffer).

---

### Match Normalizer

**File:** `backend/src/services/MatchNormalizer.ts`

Pure static class. Takes a `TxFixture` + `TxScoreEvent[]` → `MatchState`.

#### Status resolution priority

```
1. getHighestStatusId(events)  → walk all events, find the most advanced StatusId
2. statusIdToStatus(id)        → map to MatchStatus enum
3. If unknown ID → fall back to fixtureGameStateToStatus(GameState)
4. If status is still NOT_STARTED but maxSeconds > 0
     → infer FIRST_HALF / SECOND_HALF / EXTRA_TIME from clock
5. Final default → NOT_STARTED
```

This cascading logic ensures a live match with an unexpected StatusId or a missing fixture-level GameState will still be correctly classified as live.

#### `isFixtureFinished(gameState)`

Returns `true` only for explicit finished values `[5, 10, 13]`. `null` and `undefined` return **`false`** — treated as "unknown, go fetch the events and let them decide."

#### Score extraction (three-strategy cascade)

1. **Stats keys `"1"` / `"2"`** — cumulative P1/P2 goals from the latest event with a populated `Stats` object. Most reliable on live data.
2. **`Score.*.Total.Goals`** — from the latest event with a `Score` object. Fallback when Stats are absent.
3. **Count `Action='goal'` events** — last resort if neither Stats nor Score present.

#### Stats key map (TxLINE numeric keys)

| Key | Meaning |
|---|---|
| `1` | P1 goals |
| `2` | P2 goals |
| `3` | P1 yellow cards |
| `4` | P2 yellow cards |
| `5` | P1 red cards |
| `6` | P2 red cards |
| `7` | P1 corners |
| `8` | P2 corners |
| `3001` / `3002` | P1 / P2 shots (total) |
| `3003` / `3004` | P1 / P2 shots on target |
| `3007` / `3008` | P1 / P2 fouls |

---

### Momentum Engine

**File:** `backend/src/services/MomentumEngine.ts`

Calculates a single `score` in the range `[-100, 100]` where positive = home advantage and negative = away advantage.

Inputs: stats object + timeline events. Recent high-importance events (goals, red cards) are weighted more heavily than older events.

---

### AI Service

**File:** `backend/src/ai/AIService.ts`

Calls Groq (via `GROQ_API_KEY`) for three types of generated content:

| Method | Output | Trigger |
|---|---|---|
| `generateMatchPulse(match)` | 1-2 sentence real-time commentary string | Score change or every 5 min during live match |
| `generateMatchRecap(match)` | Multi-sentence match summary | Same as pulse |
| `generateTurningPoints(match)` | Array of key moments with descriptions | Match finished |
| `calculateWinProbability(match)` | `{ home, draw, away }` percentages | Synchronous, no API call — heuristic based on score + momentum |

AI content is cached in `MatchState.pulse`, `MatchState.recap`, and `MatchState.turningPoints` and re-broadcast over Socket.IO when updated.

---

### Socket Service

**File:** `backend/src/sockets/SocketService.ts`

Wraps Socket.IO. Exposes a single `broadcast(event, payload)` method used by `MatchEngine.broadcastDiffs()`.

#### Socket events emitted by backend

| Event | Payload |
|---|---|
| `scoreUpdated` | `{ matchId, homeScore, awayScore, minute }` |
| `statsUpdated` | `{ matchId, stats }` |
| `timelineUpdated` | `{ matchId, event }` |
| `momentumUpdated` | `{ matchId, momentum }` |
| `winProbabilityUpdated` | `{ matchId, winProbability: [home, draw, away] }` |
| `matchPulseUpdated` | `{ matchId, pulse: string[], headline: string }` |
| `matchFinished` | `{ matchId, homeScore, awayScore, turningPoints }` |

---

### HTTP API Routes

**Base URL:** configurable via `VITE_API_URL` (default `http://localhost:3001`)

#### Match routes (`/matches`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/matches/live` | Returns `{ live: Match[], upcoming: Match[], recent: Match[] }` |
| `GET` | `/matches/:id` | Single match detail |
| `GET` | `/matches/:id/timeline` | Timeline events only |
| `GET` | `/matches/:id/stats` | Stats object |
| `GET` | `/matches/:id/momentum` | Momentum score |
| `GET` | `/matches/:id/pulse` | AI pulse text |

#### Frontend match shape (from `toFrontendMatch`)

```ts
{
  id: string;
  home: { name: string; short: string; score: number };
  away: { name: string; short: string; score: number };
  status: 'live' | 'upcoming' | 'finished';
  minute: number;
  kickoff: string;           // e.g. "Today · 20:00"
  competition: string;
  stage: string;
  venue: string;
  momentum: number;          // -100 to 100
  headline: string;          // first sentence of AI pulse
  pulse: string[];
  joinedNow: string[];       // recap sentences
  stats: { possession, shots, shotsOnTarget, corners, fouls, xg };
  winProbability: [home%, draw%, away%];
  turningPoints: TurningPoint[];
  timeline: TimelineItem[];
}
```

---

### Hot Feed

**File:** `backend/src/routes/hotRoutes.ts`

`GET /hot` — returns a ranked feed of recent events across **all** matches, enriched with AI text.

- Iterates `matchEngine.getAllMatches()` (not just live matches — this is intentional).
- Emits items for key timeline events (goals, cards, penalties) and AI insights.
- Uses an in-memory LRU-style cache (`aiTextCache`) to avoid redundant Groq calls.
- Items are sorted by `importance` (goal=5, red card=4, penalty=3, yellow=2, others=1) then by timestamp.
- News items from `NewsAPIClient` are also injected into the feed.

---

## Frontend

### Routing

Built with **TanStack Router** (`@tanstack/react-router`). File-based routes under `src/routes/`.

| Route | File | Description |
|---|---|---|
| `/` | `src/routes/index.tsx` | Home — live + upcoming + recent sections |
| `/live` | `src/routes/live.tsx` | Full list of live matches only |
| `/hot` | `src/routes/hot.tsx` | Hot feed of events and AI insights |
| `/match/$id` | `src/routes/match.$id.tsx` | Match detail — score, stats, timeline, AI |

### Pages

#### Home (`/`)
Calls `fetchHomeMatches()` once on mount. Displays three sections: Live, Upcoming, Recent. No live polling on the home page — refresh is manual or on navigation.

#### Live (`/live`)
Also calls `fetchHomeMatches()` and renders only the `live` array. Shows a "No live matches right now" empty state when the array is empty.

#### Hot (`/hot`)
Calls `fetchHotFeed()` on mount and polls every 30 seconds. Renders event cards sorted by importance. Supports filtering by event type.

#### Match Detail (`/match/$id`)
- Initial load: `fetchMatch(id)`.
- Connects to the Socket.IO server and subscribes to all events for the match ID.
- Updates local state on `scoreUpdated`, `timelineUpdated`, `statsUpdated`, `momentumUpdated`, `winProbabilityUpdated`, `matchPulseUpdated`, `matchFinished`.

### API Client

**File:** `src/lib/api.ts`

All requests use a 5-second `AbortController` timeout. The base URL is read from `VITE_API_URL` at build time, defaulting to `http://localhost:3001`.

```ts
fetchHomeMatches()  // GET /matches/live
fetchMatch(id)      // GET /matches/:id
fetchHotFeed()      // GET /hot
```

### Real-time Updates

The frontend connects to the Socket.IO server at `VITE_API_URL`. Connection is established inside `useEffect` in the match detail page. The socket client only listens — it never emits events.

---

## Data Flow

```
TxLINE API
  │
  │ every 30s (fixture snapshot)
  ▼
MatchEngine.tick()
  └─ syncFixture(fixture) for each WC fixture
       ├─ getScoresSnapshot()   ← live / ambiguous / unknown GameState
       └─ getHistoricalScores() ← confirmed finished (GameState 5/10/13 only)
       └─ MatchNormalizer.normalize(fixture, events)
            ├─ status: events StatusId → fixtureGameState → clock inference
            ├─ score: Stats keys → Score.*.Total → count goals
            ├─ stats: Stats 3000-series → fallback to counting events
            └─ timeline: filter to key actions, sort newest first
       └─ broadcastDiffs() → Socket.IO → frontend

  │ every 10s (live matches only)
  ▼
MatchEngine.tickLive()
  └─ getScoresSnapshot() for each match in getLiveMatches()
  └─ normalize → diff → broadcast
```

---

## Match Status State Machine

```
NOT_STARTED
    │  kickoff
    ▼
FIRST_HALF
    │  StatusId=3
    ▼
HALF_TIME
    │  StatusId=4
    ▼
SECOND_HALF
    │  StatusId=5
    ▼
FINISHED ◄──────────── EXTRA_TIME ──► PENALTIES
                          ▲               │
              StatusId    │               │ StatusId=13
              7/8/9/11    │               ▼
                          └──────────── FINISHED
```

On the frontend, `status: 'live'` covers `FIRST_HALF`, `HALF_TIME`, `SECOND_HALF`, `EXTRA_TIME`, `PENALTIES`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `TXLINE_BASE_URL` | Yes | TxLINE API base URL |
| `TXLINE_JWT` | Yes | Guest JWT (30-day expiry) |
| `TXLINE_API_KEY` | Yes | Persistent subscription token |
| `TXLINE_WC_COMPETITION_ID` | No | Pin to a specific competition ID. Omit to use name+date filter. |
| `GROQ_API_KEY` | Yes | Groq API key for AI commentary |
| `NEWS_API_KEY` | No | NewsAPI key for hot feed news items |
| `PORT` | No | HTTP port (default 3001) |
| `CORS_ORIGIN` | No | Frontend origin for CORS (default `*`) |

### Frontend (`/.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (default `http://localhost:3001`) |

---

## Known Gotchas & Fixes

### Live match not appearing in frontend (fixed Jul 2026)

**Symptom:** A match is actively in progress. The Hot feed shows events from it. The `/live` page and home page show no live matches.

**Root cause:** TxLINE occasionally returns live fixtures with `GameState: null` on the fixture snapshot record (the fixture record is not always updated in sync with the score events). The old code treated `null` GameState as "finished" (`isFixtureFinished(null) === true`), which routed the fixture to `getHistoricalScores` instead of `getScoresSnapshot`. Historical events may not contain the current live StatusId, causing the match to be classified as `FINISHED` or fall through to `NOT_STARTED`. Either way, it misses `getLiveMatches()`.

**Fix applied:**
1. `isFixtureFinished(null)` now returns `false` — `null`/`undefined` GameState is treated as ambiguous, always routing to `getScoresSnapshot`.
2. `statusIdToStatus` returns `undefined` for unknown IDs instead of `NOT_STARTED`, allowing the normalizer to try other signals.
3. `normalize()` now has a clock-based inference step: if status resolves to `NOT_STARTED` but `maxSeconds > 0`, it infers `FIRST_HALF`, `SECOND_HALF`, or `EXTRA_TIME` based on elapsed seconds.
4. `bootstrapHistorical` now explicitly handles `ambiguous` (null GameState) fixtures and syncs them via snapshot alongside `live` fixtures.

**Files changed:** `MatchNormalizer.ts`, `MatchEngine.ts`

---

### Hot feed sees matches that `/live` misses

This is by design for the Hot feed — it calls `getAllMatches()` rather than `getLiveMatches()`. The Hot feed is meant to surface any notable event regardless of computed status, since the AI commentary and timeline are useful even if the status field is temporarily wrong.

The `/live` page is stricter and relies on correct status classification.

---

### TxLINE JWT expiry

The guest JWT expires every 30 days. When it expires all TxLINE API calls return `401`. Backend logs will show `TxLINE API error: 401`. Renew by calling `POST /auth/guest/start` on the TxLINE base URL (no auth required) and updating `TXLINE_JWT` in `backend/.env`.

---

### Adding new teams to the short-code map

`MatchController.ts` contains a `TEAM_SHORT` lookup table mapping full team names to 3-letter FIFA codes. If a team name from TxLINE doesn't have an entry it falls back to the first 3 characters uppercased. Add entries for any new teams to keep flags and labels accurate.
