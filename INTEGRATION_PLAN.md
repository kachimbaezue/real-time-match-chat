# Pulse — TxLINE Integration Plan

This document outlines every frontend change needed when the backend is live and serving real TxLINE data.
Nothing here touches existing UI or design. It is purely a data-wiring plan.

---

## Current State

All frontend data comes from a static file: `src/lib/matches.ts`.
Every component reads from that file directly — no API calls, no sockets.

---

## What Changes When Backend Is Live

### 1. Replace static data with API calls

**File:** `src/lib/matches.ts` → replaced by `src/lib/api.ts`

Create a thin API client that talks to the backend:

```ts
GET /matches/live      → replaces getLiveMatches()
GET /matches/upcoming  → replaces getUpcomingMatches()
GET /matches/recent    → replaces getRecentMatches()
GET /matches/:id       → replaces getMatch(id)
```

The `Match` type stays the same — the backend normalizes TxLINE data into the exact shape the frontend already expects.

---

### 2. Wire up Socket.IO for live updates

**File:** `src/lib/socket.ts` (new)

Connect to the backend socket on app load. Subscribe to match events:

| Event              | Frontend action                          |
|--------------------|------------------------------------------|
| `scoreUpdated`     | Update home/away score, minute           |
| `statsUpdated`     | Update possession, shots, xG, etc.       |
| `timelineUpdated`  | Append new event to timeline             |
| `momentumUpdated`  | Update momentum bar                      |
| `matchPulseUpdated`| Update pulse insights                    |
| `matchFinished`    | Move match to recent, show FT badge      |

---

### 3. Home page (`src/routes/index.tsx`)

- Replace the `setTimeout` mock load with `fetch('/matches/live')`, `fetch('/matches/upcoming')`, `fetch('/matches/recent')`
- Subscribe to socket events to keep live match scores/minutes updating in the cards without a page refresh
- Loading state already handled by `HeroSkeleton` and `SectionSkeleton` — no UI change needed

---

### 4. Match page (`src/routes/match.$id.tsx`)

- Replace static `getMatch(id)` lookup with `fetch('/matches/:id')`
- Subscribe to all socket events for the specific match ID on mount, unsubscribe on unmount
- Match Pulse, If You Joined Now, stats, timeline — all update reactively via socket events
- No component changes — just swap the data source

---

### 5. Environment config

**File:** `.env` (frontend)

```
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

---

### 6. Type safety

The `Match` interface in `src/lib/matches.ts` already matches the backend contract.
Once the API client is in place, delete the static `matches` array and the helper functions (`getLiveMatches`, etc.).

---

## What Does NOT Change

- All components (`Scoreboard`, `AppLayout`, `MatchCard`, `FeaturedMatch`, etc.)
- All styling and layout
- The `Match` TypeScript type shape
- Routing

---

## Order of Work (when ready)

1. Confirm backend is running and `/matches/live` returns data
2. Create `src/lib/api.ts` — fetch client
3. Create `src/lib/socket.ts` — socket client
4. Update `src/routes/index.tsx` — swap mock data
5. Update `src/routes/match.$id.tsx` — swap mock data + wire socket
6. Delete `src/lib/matches.ts` static data
7. Smoke test all pages with real data
