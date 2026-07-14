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
**Does:** Server-side rendering, middleware, error handling. The app runs as a full-stack Node.js server in production.  
**Files:** `src/start.ts`, `server.ts` (root), `vite.config.ts`

### Vite 8
**What:** Build tool and dev server.  
**Does:** Bundles the frontend, handles HMR (hot module replacement), resolves `@/` path aliases, runs TailwindCSS and TypeScript transforms.  
**Files:** `vite.config.ts`

### TailwindCSS v4
**What:** Utility-first CSS framework.  
**Does:** All styling. The theme (colours, spacing, typography) is defined in `src/styles.css` using `@theme`. Dark mode only — no light mode toggle.  
**Files:** `src/styles.css`

### shadcn/ui (via Radix UI primitives)
**What:** Headless component library.  
**Does:** Provides accessible base components (dialogs, dropdowns, tabs, etc.). Most aren't used directly in Pulse — we use custom components — but they're available as building blocks.  
**Packages:** All `@radix-ui/*` entries in `package.json`  
**Config:** `components.json`

### Hugeicons React (`hugeicons-react`)
**What:** Icon library.  
**Does:** All icons throughout the app — FootballIcon, Calendar01Icon, ArrowRight01Icon, etc. Line-style, consistent 1.75 stroke weight.  
**Files:** Used in every route and component

### Socket.io Client (`socket.io-client`)
**What:** Real-time WebSocket client.  
**Does:** Connects to the backend and receives live match updates — score changes, momentum shifts, AI pulse updates, match finished events — without page refreshes.  
**Files:** `src/lib/socket.ts`

### TanStack React Query (`@tanstack/react-query`)
**What:** Server state management.  
**Does:** Wired into the router context for data fetching patterns. Currently the app uses direct `fetch` calls in `useEffect`, but React Query is available for future caching/refetch patterns.  
**Files:** `src/router.tsx`

---

## Backend

### Express 5
**What:** HTTP server framework.  
**Does:** Serves the REST API used by the frontend. Three main endpoints: `GET /matches/live`, `GET /matches/:id`, plus stats/timeline sub-routes.  
**Files:** `backend/src/server.ts`, `backend/src/routes/matchRoutes.ts`

### Socket.io (server)
**What:** Real-time WebSocket server.  
**Does:** Broadcasts live match events to all connected frontend clients. Events: `scoreUpdated`, `statsUpdated`, `timelineUpdated`, `momentumUpdated`, `matchPulseUpdated`, `winProbabilityUpdated`, `matchFinished`.  
**Files:** `backend/src/sockets/SocketService.ts`

### TxLINE (TxODDS)
**What:** Sports data provider — the live data source.  
**Does:** Provides real-time World Cup fixture data, live scores, score events (goals, cards, corners), and odds. The backend polls this every 30 seconds via their REST API.  
**Auth:** Guest JWT (`TXLINE_JWT`) + API token (`TXLINE_API_KEY`) from on-chain subscription.  
**Current:** Connected to **devnet** (`txline-dev.txodds.com`). Switch to mainnet by changing `TXLINE_BASE_URL`.  
**Files:** `backend/src/txline/TxLineClient.ts`

### MatchEngine
**What:** Core data orchestration service.  
**Does:**
- Polls TxLINE every 30 seconds for all fixtures
- Normalises raw TxLINE events into the `Match` shape the frontend expects
- Detects diffs (score changes, new timeline events, momentum shifts) and broadcasts them via Socket.io
- Calls the AI service when score changes or every 5 minutes during live matches
- Runs finishing AI (turning points, recap, pulse) when a match ends  
**Files:** `backend/src/services/MatchEngine.ts`

### MatchNormalizer
**What:** Data transformation layer.  
**Does:** Converts raw TxLINE `TxFixture` + `TxScoreEvent[]` into the `MatchState` shape. Maps game phase codes (H1, HT, H2, F) to statuses, counts goals, builds the timeline, extracts stats.  
**Files:** `backend/src/services/MatchNormalizer.ts`

### MomentumEngine
**What:** Live momentum calculator.  
**Does:** Computes a momentum score (-100 to +100) from possession, shots, dangerous attacks, and recent events (goals, cards, corners in the last 10 minutes). Used for the momentum bar and win probability model.  
**Files:** `backend/src/services/MomentumEngine.ts`

---

## AI

### Groq (primary — **active** ✅)
**What:** Free AI inference provider using open-source models.  
**Does:** Powers all three AI features in Pulse. Fast (sub-second), free tier, no credit card.  
**Model:** `llama-3.3-70b-versatile` (Meta's Llama 3.3, 70 billion parameters)  
**Key:** `GROQ_API_KEY` in `backend/.env` — **currently set and working**  
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
| **Match Pulse** | Score change or every 5 min (live) | 1-2 sentence current state of play — shown in the Match Pulse card |
| **If You Joined Now** | Same as above | 100-word catch-up recap of the match so far |
| **Turning Points** | Match finishes | 2-3 sentences on the moments that decided the match |
| **Win Probability** | Every tick (no AI needed) | Statistical model: score diff + xG + momentum + red cards + time weight → home/draw/away % |
| **Rule-based fallback** | No API key set | All three features still work without Groq/OpenAI, just with simpler text |

---

## Functionality Map

| Feature | What it does | Files responsible |
|---|---|---|
| Home page | Shows live/upcoming/recent match cards, featured live match hero | `src/routes/index.tsx` |
| Live page | Full list of all in-progress matches | `src/routes/live.tsx` |
| Upcoming page | Scheduled matches with kickoff times | `src/routes/upcoming.tsx` |
| Recent page | Finished matches with results | `src/routes/recent.tsx` |
| Match detail | Scoreboard, AI pulse, win probability, momentum, stats, timeline, replay | `src/routes/match.$id.tsx` |
| Explore page | Team grid + fixture counts derived from real API data | `src/routes/explore.tsx` |
| Notifications | Empty state (no notification system yet) | `src/routes/notifications.tsx` |
| Search modal | Opens on search icon click, searches all matches from API | `src/components/AppLayout.tsx` |
| Sidebar | Collapsible desktop nav with sponsor logos | `src/components/AppLayout.tsx` |
| Mobile nav | Bottom pill nav bar | `src/components/AppLayout.tsx` |
| Real-time updates | Socket.io events update scores/momentum/pulse live | `src/lib/socket.ts`, `backend/src/sockets/SocketService.ts` |
| Flags | Country flag images via flagcdn.com | `src/components/Flag.tsx` |
| Scoreboard | Score display with team names and minute | `src/components/Scoreboard.tsx` |
| Knockout bracket | Tournament bracket view | `src/components/KnockoutBracket.tsx` |
| Match Replay | Animated playback of match timeline for finished games | `src/routes/match.$id.tsx` — `ReplayCard` |
| Skeleton loaders | Loading states for all pages | `src/components/SkeletonLoader.tsx` |
| Prediction rows | Win probability bar rows | `src/components/PredictionRow.tsx` |

---

## Infrastructure

| Config file | Purpose |
|---|---|
| `backend/.env` | TxLINE credentials, Groq key, port |
| `.env` | Frontend env vars (VITE_API_URL, VITE_SOCKET_URL) |
| `tsconfig.json` | TypeScript config (frontend) |
| `backend/tsconfig.json` | TypeScript config (backend) |
| `eslint.config.js` | Linting rules |
| `.prettierrc` | Code formatting |
| `components.json` | shadcn/ui component config |

---

## Status Summary

| Service | Status |
|---|---|
| Frontend dev server | ✅ `npm run dev` from root |
| Backend dev server | ✅ `npm run dev` from `backend/` |
| TxLINE devnet | ✅ Connected, 7 fixtures, 2 upcoming WC semis |
| Groq AI | ✅ Active — `gsk_K9QS...` key set |
| Real-time sockets | ✅ Wired end-to-end |
| Finished match data | ⚠️ Limited — devnet free tier only exposes fixtures your subscription covers |
| Mainnet switch | 🔜 Change `TXLINE_BASE_URL` to `https://txline.txodds.com` |
