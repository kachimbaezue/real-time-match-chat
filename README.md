# Pulse

A real-time football companion for the FIFA World Cup 2026.

Pulse explains the story of a match as it unfolds — so you understand the game, not just the score. Powered by live data from the TxLINE API, AI commentary from Groq, and delivered over WebSockets.

Built for the **World Cup Hackathon** by [@superteamNG](https://superteam.fun) and [@TXODDSOfficial](https://txline.io).

**Live:** https://pulse-omega-inky.vercel.app

---

## What it does

- **Live scoreboard** — broadcast-style, updates in real time via Socket.IO
- **Match Pulse** — AI narrative of exactly what's happening and why, updates every 5 minutes or on every goal. Collapsible.
- **Match Report** — for finished matches, a full 3-paragraph AI report: what happened, the decisive moment, what it means
- **If You Joined Now** — real-time catch-up recap for viewers who tune in late
- **Momentum engine** — shows which team is controlling the game, not just the score
- **Accurate timeline** — goals, yellow cards, red cards, penalties, substitutions with correct period-adjusted minutes
- **Win probability** — live statistical model updated on every event
- **Match replay** — watch the full match story unfold in under 90 seconds after full time
- **Save Memory** — bookmark any finished match. Works without a wallet. Connect Phantom to cryptographically sign your memory as proof you witnessed it.
- **Live nav dot** — only lights up when matches are actually in progress

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TanStack Router, TanStack Start, Tailwind CSS v4 |
| Backend | Node.js, TypeScript, Express, Socket.IO |
| Live data | TxLINE API (by TxOdds) — on-chain Solana subscription |
| AI commentary | Groq (llama-3.3-70b-versatile), OpenAI fallback |
| Analytics | Vercel Analytics |
| Frontend hosting | Vercel |
| Backend hosting | Render |

---

## Web3 / Blockchain

Pulse has two on-chain touchpoints:

**1. TxLINE subscription (Solana)**
The live data subscription is activated via a Solana smart contract transaction (`program: 9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA`). Even on the free World Cup tier, registering requires executing an on-chain `subscribe` instruction. The `TXLINE_API_KEY` in the backend is the token returned after that transaction was confirmed on mainnet.

**2. Phantom wallet — signed match memories**
Users can connect Phantom to sign match memories. When "Sign & Save Memory" is tapped:
- Phantom prompts the user to sign a message containing the match ID, final score, and timestamp
- The resulting Ed25519 signature (base64) is stored as `txRef` on the memory
- The memory is keyed to the wallet address — recoverable on any device by reconnecting the same wallet
- Signed memories show a green "Signed" badge in the Memories page

Without a wallet, Save Memory still works — it uses a stable random local ID from `localStorage`.

---

## Data Pipeline

```
TxLINE API (scores/snapshot every 30s, live fast-poll every 10s)
  └─ MatchNormalizer → MatchState (score, status, period-accurate minutes, stats)
  └─ AIService (Groq) → pulse string / match report / recap / turning points
  └─ Socket.IO → frontend (score, stats, timeline, momentum, pulse diffs)
```

Key normalizer behaviours:
- `Clock.Seconds` is period-relative — offset added per StatusId (H2 = +45min, ET = +90min)
- Score from `Stats["1"]`/`Stats["2"]` (cumulative) → fallback to `Score.*.Total.Goals` → fallback to counting goal events
- Possession: counted from `possession`/`safe_possession` events — shows "est." when fewer than 5 events

---

## Project Structure

```
/
├── src/                     # Frontend (React + TanStack Router)
│   ├── routes/              # Pages: index, live, hot, recent, match.$id, memories
│   ├── components/          # AppLayout, Scoreboard, SaveMemoryButton, WalletModal, etc.
│   └── lib/
│       ├── matches.ts       # Match TypeScript types
│       ├── api.ts           # REST API client
│       ├── socket.ts        # Socket.IO client + typed event helpers
│       ├── wallet.ts        # Phantom wallet integration (connect, sign, disconnect)
│       └── memories.ts      # localStorage memory store + getOrCreateLocalId
│
├── backend/                 # Node.js backend (deployed on Render)
│   └── src/
│       ├── server.ts
│       ├── routes/          # matchRoutes, hotRoutes, aiRoutes
│       ├── controllers/     # MatchController (toFrontendMatch, debug endpoints)
│       ├── services/        # MatchEngine, MomentumEngine, MatchNormalizer
│       ├── txline/          # TxLineClient (fixture snapshot, scores, historical)
│       ├── ai/              # AIService (Groq/OpenAI pulse, report, recap, turning points)
│       ├── sockets/         # Socket.IO broadcast service
│       └── types/           # Shared TypeScript types
│
├── docs/                    # Technical documentation (GitBook-ready)
├── index.html               # Dev CSP (includes va.vercel-scripts.com for analytics)
├── vercel.json              # Production CSP + cache headers
└── render.yaml              # Render backend config
```

---

## Getting Started (Local)

### Prerequisites
- Node.js 18+
- TxLINE JWT and API key from [txodds.com](https://txline.io)
- Groq API key from [console.groq.com](https://console.groq.com) (free)

### 1. Install frontend
```bash
npm install
```

### 2. Set up backend
```bash
cd backend
npm install
copy .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
TXLINE_BASE_URL=https://txline-dev.txodds.com
TXLINE_JWT=your_guest_jwt
TXLINE_API_KEY=your_api_key
TXLINE_WC_COMPETITION_ID=72
TXLINE_KNOWN_FIXTURE_IDS=18241006
GROQ_API_KEY=your_groq_key
NODE_ENV=development
```

> For mainnet data use `https://txline.txodds.com`. Devnet has ~2 fixtures only.

### 3. Start both

**Terminal 1 — Backend**
```bash
cd backend && npm run dev
```

**Terminal 2 — Frontend**
```bash
npm run dev
```

Frontend → `http://localhost:5173` · Backend → `http://localhost:3001`

---

## Key API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/matches/live` | `{ live, upcoming, recent }` — all match categories |
| GET | `/matches/previous` | All finished matches |
| GET | `/matches/:id` | Full match detail with AI content |
| GET | `/matches/debug/snapshot` | TxLINE snapshot state + engine state (debug) |
| GET | `/matches/debug/fixture/:id` | Raw TxLINE data vs normalized for a fixture |
| GET | `/hot` | Ranked feed of events + AI insights across all matches |
| GET | `/health` | Backend uptime check |

## Socket.IO Events

| Event | Payload |
|---|---|
| `scoreUpdated` | `{ matchId, homeScore, awayScore, minute }` |
| `statsUpdated` | `{ matchId, stats }` |
| `timelineUpdated` | `{ matchId, event }` |
| `momentumUpdated` | `{ matchId, momentum }` |
| `matchPulseUpdated` | `{ matchId, pulse, headline }` |
| `winProbabilityUpdated` | `{ matchId, winProbability }` |
| `matchFinished` | `{ matchId, homeScore, awayScore, turningPoints }` |

---

## Credits

- Live data: [TxLINE by TxOdds](https://txline.io)
- Hackathon: [Superteam](https://superteam.fun)
- AI: [Groq](https://groq.com) + Meta Llama 3.3 70B
