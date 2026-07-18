# System Architecture

## Overview

Pulse is split into two independently deployed services. The backend is a persistent Node.js process — it maintains an in-memory match state map, runs a polling loop, and holds open Socket.IO connections. Vercel serverless functions cannot do any of this, so the split is mandatory.

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  React 19 + TanStack Router (SPA, deployed on Vercel)          │
│                                                                 │
│  ┌──────────────┐   HTTP GET    ┌─────────────────────────┐    │
│  │  Page routes │ ──────────── ▶│  Express REST API       │    │
│  │  index.tsx   │               │  /matches/live          │    │
│  │  match.$id   │   Socket.IO   │  /matches/:id           │    │
│  │  hot.tsx     │ ◀──────────── │  /hot                   │    │
│  │  moments.tsx │   (WSS)       │  /ai/chat               │    │
│  └──────────────┘               └────────────┬────────────┘    │
└───────────────────────────────────────────────┼────────────────┘
                                                │
                              ┌─────────────────▼─────────────────┐
                              │     Node.js Backend (Render)       │
                              │                                    │
                              │  ┌──────────────────────────────┐ │
                              │  │         MatchEngine          │ │
                              │  │  - polls TxLINE every 30s    │ │
                              │  │  - fast live poll every 10s  │ │
                              │  │  - in-memory Map<id,State>   │ │
                              │  │  - bootstraps on startup     │ │
                              │  └──────────────┬───────────────┘ │
                              │                 │                  │
                              │  ┌──────────────▼───────────────┐ │
                              │  │       MatchNormalizer        │ │
                              │  │  - TxFixture + TxScoreEvent  │ │
                              │  │    → MatchState              │ │
                              │  │  - StatusId → MatchStatus    │ │
                              │  │  - Stats key map (1-8)       │ │
                              │  └──────────────┬───────────────┘ │
                              │                 │                  │
                              │  ┌──────────────▼───────────────┐ │
                              │  │        MomentumEngine        │ │
                              │  │  - score: -100 to +100       │ │
                              │  │  - possession + shots +      │ │
                              │  │    danger attacks + events   │ │
                              │  └──────────────┬───────────────┘ │
                              │                 │                  │
                              │  ┌──────────────▼───────────────┐ │
                              │  │          AIService           │ │
                              │  │  - Groq llama-3.3-70b        │ │
                              │  │  - Match Pulse (live)        │ │
                              │  │  - If You Joined Now         │ │
                              │  │  - Turning Points (FT)       │ │
                              │  │  - Win Probability (math)    │ │
                              │  └──────────────┬───────────────┘ │
                              │                 │                  │
                              │  ┌──────────────▼───────────────┐ │
                              │  │        SocketService         │ │
                              │  │  - broadcasts diffs only     │ │
                              │  │  - 7 event types             │ │
                              │  └──────────────────────────────┘ │
                              │                 │                  │
                              └─────────────────┼──────────────────┘
                                                │ HTTP + WSS
                              ┌─────────────────▼──────────────────┐
                              │         TxLINE API                 │
                              │     txline.txodds.com              │
                              │                                    │
                              │  /api/fixtures/snapshot            │
                              │  /api/scores/snapshot/:id          │
                              │  /api/scores/updates/:id           │
                              │  /api/scores/historical/:id        │
                              └────────────────────────────────────┘
```

---

## Data Pipeline

### Startup bootstrap (one-time on server start)

1. `MatchEngine.startPolling()` calls `bootstrapHistorical()`
2. Fetches `GET /api/fixtures/snapshot?competitionId=72`
3. Splits fixtures into: finished / live / upcoming
4. For each finished fixture → `getHistoricalScores(fixtureId)`
5. For each live/upcoming fixture → `getScoresSnapshot(fixtureId)`
6. Runs `MatchNormalizer.normalize(fixture, events)` on each
7. Calculates `winProbability` via `AIService.calculateWinProbability()`
8. Stores all `MatchState` objects in `Map<string, MatchState>`
9. Generates AI text for finished matches in the background

### Polling loop (every 30s)

- Re-fetches the full fixture snapshot
- For any fixture not yet in memory: syncs it
- For fixtures now finished that were previously live: triggers finishing AI

### Fast live poll (every 10s)

- Targets only currently live matches
- Calls `getScoresSnapshot(fixtureId)` for each live match
- Re-normalizes and diffs against previous state
- Broadcasts only changed fields via Socket.IO

### Hardcoded finished fixtures

TxLINE's snapshot only returns fixtures within a ~30-day window and drops finished ones. Any completed match that fell off the snapshot is bootstrapped from the `KNOWN_WC_FINISHED_FIXTURES` array in `MatchEngine.ts` using `getScoresSnapshot()` directly.

---

## Frontend data flow

```
Page load
  │
  ├─ fetchHomeMatches()  →  GET /matches/live
  │    returns { live[], upcoming[], recent[] }
  │
  ├─ useState(live, upcoming, recent)  →  render cards
  │
  └─ useEffect socket subscriptions
       onScoreUpdated     → update score + minute in state
       onMomentumUpdated  → update momentum bar
       onMatchPulseUpdated→ update headline text
       onMatchFinished    → move match from live[] to recent[]
```

Match detail page additionally subscribes to:
- `statsUpdated` → live stat rows
- `timelineUpdated` → append new event to timeline
- `winProbabilityUpdated` → update probability bar

---

## Directory structure

```
/
├── src/                        Frontend (React + TanStack)
│   ├── routes/
│   │   ├── __root.tsx          Root layout (QueryClient, AppLayout)
│   │   ├── index.tsx           Home — live/upcoming/recent cards
│   │   ├── live.tsx            All live matches
│   │   ├── upcoming.tsx        Scheduled matches
│   │   ├── recent.tsx          Finished matches
│   │   ├── match.$id.tsx       Full match detail + replay
│   │   ├── hot.tsx             Live spaghetti thread
│   │   └── moments.tsx         WC2026 history + AI chat
│   ├── components/
│   │   ├── AppLayout.tsx       Sidebar + mobile nav + search
│   │   ├── Scoreboard.tsx      Score display component
│   │   ├── Flag.tsx            Country flag via flagcdn.com
│   │   ├── KnockoutBracket.tsx Tournament bracket
│   │   ├── PredictionRow.tsx   Win probability bar
│   │   ├── Preloader.tsx       Intro animation
│   │   └── SkeletonLoader.tsx  Loading states
│   └── lib/
│       ├── api.ts              REST client (fetch wrapper)
│       ├── socket.ts           Socket.IO client singleton
│       ├── matches.ts          Match TypeScript types
│       └── utils.ts            Helpers
│
├── backend/src/
│   ├── server.ts               Express + Socket.IO bootstrap
│   ├── config/env.ts           Zod-validated env schema
│   ├── routes/
│   │   ├── matchRoutes.ts      /matches/* routes
│   │   ├── hotRoutes.ts        /hot route
│   │   └── aiRoutes.ts         /ai/chat route
│   ├── controllers/
│   │   └── MatchController.ts  Request handlers
│   ├── services/
│   │   ├── MatchEngine.ts      Polling, state, diffs, AI triggers
│   │   ├── MatchNormalizer.ts  TxLINE → MatchState transform
│   │   ├── MomentumEngine.ts   Momentum score calculator
│   │   └── NewsAPIClient.ts    NewsAPI integration
│   ├── txline/
│   │   └── TxLineClient.ts     TxLINE HTTP client + TypeScript types
│   ├── ai/
│   │   └── AIService.ts        Groq/OpenAI chat + rule-based fallbacks
│   ├── sockets/
│   │   └── SocketService.ts    Socket.IO broadcast wrapper
│   └── types/
│       └── index.ts            Shared MatchState, MatchStatus, etc.
│
├── scripts/build-vercel.mjs    Post-build: dist/spa → .vercel/output/
├── vite.config.spa.ts          SPA build config (used for Vercel)
├── vite.config.ts              TanStack Start config (local dev)
├── vercel.json                 Vercel deployment config
└── render.yaml                 Render deployment config
```
