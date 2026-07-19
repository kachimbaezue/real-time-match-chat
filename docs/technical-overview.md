# Pulse — Technical Overview

> Real-time football match intelligence platform powered by TxLINE live data, AI commentary, Phantom wallet signing, and WebSocket delivery.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend](#backend)
3. [Frontend](#frontend)
4. [Data Flow](#data-flow)
5. [Match Status & Timeline Accuracy](#match-status--timeline-accuracy)
6. [AI Features](#ai-features)
7. [Web3 & Blockchain](#web3--blockchain)
8. [Environment Variables](#environment-variables)
9. [Known Gotchas & Fixes](#known-gotchas--fixes)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                  FRONTEND (Vite + React 19)                   │
│  /  /live  /hot  /recent  /match/:id  /memories              │
│  fetchHomeMatches()  fetchHotFeed()  fetchMatch()            │
│  Socket.IO client ── scoreUpdated, timelineUpdated, …        │
│  Phantom wallet ── connect, signMessage                      │
└──────────────────┬───────────────────────────────────────────┘
                   │ HTTP + WebSocket
                   ▼
┌──────────────────────────────────────────────────────────────┐
│               BACKEND (Node + Express + Socket.IO)            │
│                                                              │
│  GET /matches/live       → { live, upcoming, recent }        │
│  GET /matches/previous   → all finished matches              │
│  GET /matches/:id        → full match + AI content           │
│  GET /hot                → ranked event + insight feed       │
│  GET /matches/debug/*    → TxLINE snapshot inspection        │
│                                                              │
│  MatchEngine             in-memory Map<id, MatchState>       │
│    ├─ 30s full snapshot poll (discovers new/changed fixtures)│
│    └─ 10s live-only poll (fast score/event updates)          │
│                                                              │
│  MatchNormalizer         TxLINE events → MatchState          │
│  MomentumEngine          stats + timeline → momentum score   │
│  AIService               Groq/OpenAI → pulse, report, recap  │
│  SocketService           diffs → Socket.IO broadcast         │
└──────────────────┬───────────────────────────────────────────┘
                   │ HTTPS
                   ▼
       TxLINE API  (Solana on-chain subscription, CompetitionId=72)
```

---

## Backend

### MatchEngine

Singleton. Owns all match state. Key methods:

| Method | Returns |
|---|---|
| `getLiveMatches()` | `FIRST_HALF \| HALF_TIME \| SECOND_HALF \| EXTRA_TIME \| PENALTIES` |
| `getUpcomingMatches()` | `NOT_STARTED` |
| `getRecentMatches()` | `FINISHED`, newest first |
| `getAllMatches()` | Everything in memory |

**Bootstrap on startup:**
1. `/api/fixtures/snapshot` — picks up live, upcoming, ambiguous (null GameState) fixtures
2. `/api/fixtures?from=2026-06-11&to=2026-07-20` — date-range discovery of dropped-off historical fixtures
3. `TXLINE_KNOWN_FIXTURE_IDS` env var — comma-separated IDs, always bootstrapped
4. `KNOWN_WC_FINISHED_FIXTURES` — hardcoded list with team metadata as fallback

**syncFixture strategy:**
- Always calls `scores/snapshot` first (most complete, always authoritative)
- Falls back to `scores/historical` only if snapshot returns empty AND fixture is confirmed finished

**World Cup filter:**
Uses OR logic — a fixture matches if `CompetitionId === wcId` OR competition name contains "world cup" OR kickoff date is within the WC 2026 window. This prevents missing fixtures where TxLINE's CompetitionId differs from the configured value.

### MatchNormalizer

Pure static class. Converts `TxFixture + TxScoreEvent[]` → `MatchState`.

**Status resolution priority:**
```
events StatusId (highest wins) → fixtureGameState → clock inference
```

`isFixtureFinished(null)` returns `false` — null GameState means "unknown", routes to `scores/snapshot` not historical.

**Timeline minute accuracy (fixed):**

`Clock.Seconds` resets to 0 at the start of each period. The normalizer now offsets by period:

| StatusId | Period | Offset |
|---|---|---|
| 2 | H1 | +0 min |
| 3 | HT | fixed 45' |
| 4 | H2 | +45 min |
| 5 | FT | fixed 90' |
| 7/8/9/11 | ET | +90 min |
| 12 | Penalties | fixed 120' |

This means a goal scored 3 minutes into the second half correctly shows as `48'` not `3'`.

**Score extraction (3-strategy cascade):**
1. `Stats["1"]` / `Stats["2"]` — cumulative P1/P2 goals from latest event with Stats
2. `Score.*.Total.Goals` — from latest event with Score object
3. Count `Action=goal` events

**Stats key map (confirmed from live TxLINE data):**

| Key | Meaning |
|---|---|
| 1 / 2 | P1 / P2 goals |
| 3 / 4 | P1 / P2 yellow cards |
| 5 / 6 | P1 / P2 red cards |
| 7 / 8 | P1 / P2 corners |
| 3001 / 3002 | P1 / P2 shots |
| 3003 / 3004 | P1 / P2 shots on target |
| 3007 / 3008 | P1 / P2 fouls |

**Possession:** counted from `possession`/`safe_possession` events per team. Only used when >5 events are present, otherwise shown as "Possession (est.)" at 50/50.

**xG:** TxLINE does not provide expected goals. The xG row is hidden when both values are 0.

### AIService

Uses Groq (`llama-3.3-70b-versatile`) as primary, OpenAI `gpt-4o-mini` as fallback, rule-based if no key.

| Method | Trigger | Output |
|---|---|---|
| `generateMatchPulse` (live) | Score change or every 5 min | 2–3 sentence live narrative, ~150 tokens |
| `generateMatchPulse` (finished) | Match ends | 3-paragraph match report — what happened / decisive moment / significance, ~350 tokens |
| `generateMatchRecap` | Same as pulse | "If You Joined Now" catch-up, <100 words |
| `generateTurningPoints` | Match finishes | 2–3 decisive moments, 1 sentence each |
| `calculateWinProbability` | Every normalize | Heuristic model: score diff + momentum + shots + red cards + time weighting |

Finished match pulse is split on `\n\n` by `toFrontendMatch` → sent as `string[]` to frontend. Frontend renders each paragraph separately in "Match Report" mode.

### HTTP Routes

| Path | Description |
|---|---|
| `GET /matches/live` | `{ live, upcoming, recent }` |
| `GET /matches/previous` | `{ matches, total }` — all finished |
| `GET /matches/:id` | Full match + AI |
| `GET /matches/debug/snapshot` | Competition breakdown, engine state, WC fixtures |
| `GET /matches/debug/fixture/:id` | Raw TxLINE events + normalized + frontend shape |
| `GET /hot` | Ranked feed of events + AI insights |
| `GET /health` | Uptime |

### Socket.IO Events

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

## Frontend

### Pages

| Route | Purpose |
|---|---|
| `/` | Home — live featured match + sections for upcoming/recent |
| `/live` | All live matches |
| `/hot` | Ranked feed of events + AI insights across all matches |
| `/recent` | All finished matches |
| `/match/:id` | Full match detail — scoreboard, pulse/report, stats, timeline, replay |
| `/memories` | Saved match memories (no wallet required, wallet optional for signing) |

### Match Detail — MatchPulseCard behaviour

- **Live match:** card is open by default, shows rotating 2–3 sentence pulse, auto-advances every 5s. Header shows live dot.
- **Finished match:** card is collapsed by default (shows "Match Report" header + arrow). User taps to expand the full 3-paragraph AI report. Timeline of all events included inside the card.
- Toggle is a full-width clickable header with a rotating chevron arrow — no icon buttons.

### StatsCard — real data only

- xG row hidden when both values are 0 (TxLINE doesn't provide xG)
- Possession shows "Possession (est.)" and 50% opacity when exactly 50/50 (insufficient TxLINE events)
- All other stats are direct from TxLINE 3000-series keys

### WinProbabilityCard

Hidden entirely when `winProbability` is null (not yet computed). Never shows the fake `[33,34,33]` placeholder.

---

## Web3 & Blockchain

### TxLINE On-Chain Subscription

The backend's TxLINE API key was activated via a Solana smart contract transaction:
- Program: `9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA`
- Token mint: `Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL`
- Service Level 1, 4 weeks, FIFA World Cup 2026 (CompetitionId=72)

### Phantom Wallet — Signed Memories

**Without wallet:** Save Memory works immediately. Uses a stable random UUID from `localStorage` (`pulse_local_id`) as the identity key. Device-bound.

**With Phantom connected:**
1. User taps "Sign & Save Memory"
2. Phantom prompts to sign a UTF-8 message: `Pulse Memory\nMatch: ...\nID: ...\nSaved: ...`
3. Ed25519 signature returned as `Uint8Array`, base64-encoded
4. Stored as `txRef` on the `MatchMemory` object
5. Memory keyed to wallet address — retrievable across devices by reconnecting same wallet
6. Signed memories show a green "Signed" badge in the Memories page

The signature is verifiable off-chain: `nacl.sign.open(signature, publicKey, message)`. No SOL is spent; this is a `signMessage` call, not a transaction.

### WalletModal Flow

- If Phantom is NOT installed: shows two-step guide — "Install Phantom" (link to phantom.app/download) then "Refresh and connect"
- If Phantom IS installed: shows single "Connect Phantom" button
- Wallet connection is never a gate — Save Memory, Memories page, and all match features work without it

---

## Data Flow

```
TxLINE API
  │ every 30s
  ▼
MatchEngine.tick()
  └─ getFixtures(wcId) → filterWorldCup → syncFixture each
       syncFixture:
         ├─ scores/snapshot (always tried first)
         └─ scores/historical (fallback for confirmed finished)
         └─ MatchNormalizer.normalize(fixture, events)
              ├─ status: events StatusId → gameState → clock inference
              ├─ score: Stats["1"]/["2"] → Score.Total → count goals
              ├─ minute: Clock.Seconds + period offset (H2=+45min, ET=+90min)
              ├─ stats: 3000-series keys → event counting fallback
              └─ timeline: key actions, period-adjusted minutes, sorted newest first
         └─ broadcastDiffs → Socket.IO

  │ every 10s (live matches only)
  ▼
MatchEngine.tickLive()
  └─ scores/snapshot for each live match → normalize → diff → broadcast

  │ on startup
  ▼
bootstrapAllHistorical()
  ├─ /api/fixtures date-range query (auto-discovers all WC fixtures)
  └─ TXLINE_KNOWN_FIXTURE_IDS + KNOWN_WC_FINISHED_FIXTURES (manual fallback)
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `TXLINE_BASE_URL` | Yes | `https://txline.txodds.com` (mainnet) or `https://txline-dev.txodds.com` (devnet, 2 fixtures only) |
| `TXLINE_JWT` | Yes | Guest JWT from `POST /auth/guest/start` (30-day expiry) |
| `TXLINE_API_KEY` | Yes | Activated API token from on-chain subscription |
| `TXLINE_WC_COMPETITION_ID` | No | Set to `72` for FIFA WC 2026. Used as a hint — OR logic with name/date filter |
| `TXLINE_KNOWN_FIXTURE_IDS` | No | Comma-separated fixture IDs to always bootstrap. e.g. `18241006` |
| `GROQ_API_KEY` | Recommended | Free at console.groq.com. Required for AI pulse/report/recap |
| `OPENAI_API_KEY` | No | Fallback if Groq unavailable |
| `NEWS_API_KEY` | No | NewsAPI key for hot feed news injection |
| `PORT` | No | Default 3001 |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL. Dev: `http://localhost:3001`. Prod: set in Vercel dashboard. |
| `VITE_SOCKET_URL` | Socket.IO URL. Usually same as `VITE_API_URL`. |

---

## Known Gotchas & Fixes

### Live match not appearing (fixed)
`isFixtureFinished(null)` was returning `true` — live fixtures with null GameState were routed to `getHistoricalScores` instead of `getScoresSnapshot`. Fixed: null GameState now means "unknown", always fetches snapshot.

### Timeline minutes wrong for H2 events (fixed)
TxLINE `Clock.Seconds` resets to 0 at each period start. Events in H2 were showing as e.g. `3'` instead of `48'`. Fixed by adding a period offset based on `StatusId` per event.

### Only 1 WC fixture from snapshot (partial)
When `TXLINE_WC_COMPETITION_ID` is set, the old code used it as an exclusive filter. Fixtures with a different CompetitionId were dropped. Fixed: now uses OR logic — CompetitionId match OR name contains "world cup" OR date in WC 2026 window.

### TxLINE devnet limitation
`txline-dev.txodds.com` only exposes ~2 fixtures. This is by design — devnet is for API integration testing only. All World Cup data requires mainnet (`txline.txodds.com`) with an activated subscription.

### Vercel Analytics blocked by CSP (fixed)
`va.vercel-scripts.com` was missing from `script-src` in both `index.html` (dev) and `vercel.json` (prod). Added to both.

### JWT expiry
Guest JWT expires every 30 days. When expired, all TxLINE calls return 401. Renew via `POST /auth/guest/start` and update `TXLINE_JWT` in the environment.
