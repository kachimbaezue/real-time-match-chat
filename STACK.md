# Pulse — Tech Stack & Functionality Reference

Everything that makes this app work, what it does, and which file is responsible.

---

## Frontend

### React 19
**What:** UI library.
**Does:** Renders all components, manages state with `useState`/`useEffect`.
**Files:** Every file in `src/`

### TanStack Router (`@tanstack/react-router`)
**What:** File-based routing.
**Does:** Handles all page navigation — `/`, `/live`, `/upcoming`, `/recent`, `/match/$id`, etc. Route files in `src/routes/` auto-generate the route tree in `src/routeTree.gen.ts`.
**Files:** `src/routes/*.tsx`, `src/router.tsx`, `src/routeTree.gen.ts`

### TanStack Start (`@tanstack/react-start`)
**What:** SSR framework built on top of TanStack Router.
**Does:** Server-side rendering, middleware, error handling.
**Files:** `vite.config.ts`

### Vite 8
**What:** Build tool and dev server.
**Does:** Bundles the frontend, handles HMR, resolves `@/` path aliases, runs TailwindCSS and TypeScript transforms.
**Files:** `vite.config.ts`

### TailwindCSS v4
**What:** Utility-first CSS framework.
**Does:** All styling. Theme defined in `src/styles.css` using `@theme`. Dark mode only.
**Files:** `src/styles.css`

### Hugeicons React (`hugeicons-react`)
**What:** Icon library.
**Does:** All icons throughout the app. Line-style, 1.75 stroke weight.
**Files:** Used in every route and component

### Socket.io Client (`socket.io-client`)
**What:** Real-time WebSocket client.
**Does:** Connects to the backend and receives live match updates without page refreshes.
**Files:** `src/lib/socket.ts`

### TanStack React Query (`@tanstack/react-query`)
**What:** Server state management.
**Does:** Wired into the router context. App uses direct `fetch` in `useEffect`; React Query available for future caching patterns.
**Files:** `src/router.tsx`

---

## Backend

### Express 5
**What:** HTTP server framework.
**Does:** Serves the REST API. Main endpoints: `GET /matches/live`, `GET /matches/:id`, debug endpoint.
**Files:** `backend/src/server.ts`, `backend/src/routes/matchRoutes.ts`

### Socket.io (server)
**What:** Real-time WebSocket server.
**Does:** Broadcasts live match events to all connected clients.
Events: `scoreUpdated`, `statsUpdated`, `timelineUpdated`, `momentumUpdated`, `matchPulseUpdated`, `winProbabilityUpdated`, `matchFinished`.
**Files:** `backend/src/sockets/SocketService.ts`

### TxLINE (TxODDS)
**What:** Sports data provider — the live data source.
**Does:** Provides real-time World Cup fixture data, live scores, and score events (goals, cards, corners). Backend polls every 30 seconds via `GET /api/fixtures/snapshot`.
**Auth:** Guest JWT (`TXLINE_JWT`) + API token (`TXLINE_API_KEY`).
**Endpoint used:** `/api/fixtures/snapshot` — the only endpoint available on guest credentials. No `/api/fixtures` date-range endpoint (returns 404 on both devnet and mainnet for guest tier).
**Devnet vs Mainnet:**
- `txline-dev.txodds.com` — only 2 fixtures (current live matches), no history
- `txline.txodds.com` — 100+ World Cup fixtures including all group stage (finished), knockouts (live/finished), upcoming semis/final
- **Always use mainnet** (`TXLINE_BASE_URL=https://txline.txodds.com`) for Recent matches to work
**Files:** `backend/src/txline/TxLineClient.ts`

### MatchEngine
**What:** Core data orchestration service.
**Does:**
- On startup: loads all fixtures from snapshot, identifies finished ones (no GameState = finished), populates the Recent list
- Polls TxLINE every 30 seconds for live fixture updates
- Normalises raw TxLINE events into the `Match` shape the frontend expects
- Detects diffs (score changes, new events, momentum shifts) and broadcasts via Socket.io
- Calls AI service on score changes or every 5 minutes during live matches
- Runs finishing AI (turning points, recap, pulse) when a match ends
**Files:** `backend/src/services/MatchEngine.ts`

### MatchNormalizer
**What:** Data transformation layer.
**Does:** Converts raw `TxFixture` + `TxScoreEvent[]` into `MatchState`. Maps game phase codes (H1/HT/H2/F) to statuses, counts goals, builds timeline, extracts stats.
**Key rule:** `GameState === undefined || null` → `FINISHED` (TxLINE convention for completed fixtures).
**Files:** `backend/src/services/MatchNormalizer.ts`

### MomentumEngine
**What:** Live momentum calculator.
**Does:** Computes a momentum score (-100 to +100) from possession, shots, dangerous attacks, and recent events. Used for the momentum bar and win probability model.
**Files:** `backend/src/services/MomentumEngine.ts`

---

## AI

### Groq (primary — **active** ✅)
**What:** Free AI inference provider using open-source models.
**Does:** Powers all three AI narrative features. Fast (sub-second), free tier.
**Model:** `llama-3.3-70b-versatile`
**Key:** `GROQ_API_KEY` in `backend/.env`
**Get a key:** https://console.groq.com
**Files:** `backend/src/ai/AIService.ts`

### OpenAI (fallback — inactive)
**What:** GPT-4o-mini fallback if Groq is unavailable.
**Model:** `gpt-4o-mini`
**Key:** `OPENAI_API_KEY` in `backend/.env` — currently empty
**Files:** `backend/src/ai/AIService.ts`

### AIService — what it generates

| Feature | Trigger | What it produces |
|---|---|---|
| **Match Pulse** | Score change or every 5 min (live) | 1-2 sentence state of play — shown in the Match Pulse card |
| **If You Joined Now** | Same as above | 100-word catch-up recap of the match so far |
| **Turning Points** | Match finishes | 2-3 sentences on the moments that decided the match |
| **Win Probability** | Every tick (pure math) | Score diff + xG + momentum + red cards + time weight → home/draw/away % |
| **Rule-based fallback** | No API key set | All features still work, with simpler template text |

---

## Hosting / Infrastructure

### Vercel (Frontend)
**What:** Static/SSR hosting for the React app.
**Does:** Deploys the frontend on every push. Handles routing via `vercel.json`.
**Config:** `vercel.json`
**Env vars to set:** `VITE_API_URL`, `VITE_SOCKET_URL` (point to Render backend URL)

### Render (Backend)
**What:** Always-on Node.js hosting for the Express + Socket.IO server.
**Does:** Runs the persistent backend — polling loop, socket connections, and REST API. Cannot use Vercel because serverless functions terminate after each request (no persistent polling or Socket.IO).
**Config:** `render.yaml`
**Free tier:** Spins down after 15 min of inactivity. Use UptimeRobot to ping `/health` every 5 min to keep it warm, or upgrade to $7/mo Starter plan.
**Guide:** See `DEPLOY.md` for full setup steps.

---

## Functionality Map

| Feature | What it does | Files responsible |
|---|---|---|
| Home page | Live/upcoming/recent match cards, featured live hero | `src/routes/index.tsx` |
| Live page | All in-progress matches | `src/routes/live.tsx` |
| Upcoming page | Scheduled matches with kickoff times | `src/routes/upcoming.tsx` |
| Recent page | Finished matches with results and AI analysis | `src/routes/recent.tsx` |
| Match detail | Scoreboard, AI pulse, win probability, momentum, stats, timeline, replay | `src/routes/match.$id.tsx` |
| Live nav dot | Red dot on Live icon — only shows when matches are actually live | `src/components/AppLayout.tsx` |
| Search modal | Opens on search icon, searches all matches from API | `src/components/AppLayout.tsx` |
| Sidebar | Collapsible desktop nav with sponsor logos (Superteam, TxLine) | `src/components/AppLayout.tsx` |
| Mobile nav | Bottom pill nav bar | `src/components/AppLayout.tsx` |
| Real-time updates | Socket.io events update scores/momentum/pulse live | `src/lib/socket.ts` |
| Flags | Country flag images via flagcdn.com | `src/components/Flag.tsx` |
| Scoreboard | Score display with team names and minute | `src/components/Scoreboard.tsx` |
| Knockout bracket | Tournament bracket view | `src/components/KnockoutBracket.tsx` |
| Match Replay | Animated timeline playback for finished games | `src/routes/match.$id.tsx` — `ReplayCard` |
| Skeleton loaders | Loading states for all pages | `src/components/SkeletonLoader.tsx` |
| Win probability bar | Prediction rows with home/draw/away % | `src/components/PredictionRow.tsx` |
| Debug endpoint | Inspect engine state + snapshot data | `GET /matches/debug/snapshot` |

---

## Config Files

| File | Purpose |
|---|---|
| `backend/.env` | TxLINE credentials, Groq key, port — **use mainnet URL** |
| `.env` | Frontend env vars (`VITE_API_URL`, `VITE_SOCKET_URL`) |
| `render.yaml` | Render backend deployment config |
| `vercel.json` | Vercel frontend SPA routing |
| `DEPLOY.md` | Step-by-step production deployment guide |
| `tsconfig.json` | TypeScript config (frontend) |
| `backend/tsconfig.json` | TypeScript config (backend) |
| `eslint.config.js` | Linting rules |
| `.prettierrc` | Code formatting |
| `components.json` | shadcn/ui component config |

---

## Status Summary

| Service | Status |
|---|---|
| Frontend (Vercel) | ✅ Deploy with `npm run build` |
| Backend (Render) | ✅ `render.yaml` config ready — deploy via Render dashboard |
| TxLINE mainnet | ✅ 100+ WC fixtures, finished matches available via snapshot |
| TxLINE devnet | ⚠️ Only 2 fixtures, no history — use mainnet |
| Groq AI | ✅ Active — key set in `backend/.env` |
| Real-time sockets | ✅ Wired end-to-end, CORS open for `*.vercel.app` |
| Recent matches | ✅ Works on mainnet — snapshot has 80+ finished group/knockout fixtures |
| Live nav dot | ✅ Data-driven — shows only when live matches exist |
