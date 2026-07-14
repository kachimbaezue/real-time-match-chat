# Pulse

A second-screen football companion for the FIFA World Cup 2026.

Pulse explains the story of a match in real time — so you understand the game, not just the score. Powered by live data from the TxLINE API and AI-generated insights from Groq.

Built for the **World Cup Hackathon** by [@superteamNG](https://superteam.fun) and [@TXODDSOfficial](https://txline.io).

---

## What it does

- Live scoreboard with broadcast-style display
- Match Pulse — AI-written explanation of what's happening and why
- If You Joined Now — a real-time catch-up recap for late viewers
- Momentum engine — shows which team currently controls the game
- Win probability, live stats, and full match timeline
- Match replay for finished games
- Live red dot indicator on the nav — only shows when matches are actually live

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TanStack Router, TanStack Start, Tailwind CSS v4 |
| Backend | Node.js, TypeScript, Express, Socket.IO |
| Live data | TxLINE API (by TxOdds) |
| AI insights | Groq (llama-3.3-70b-versatile), OpenAI fallback |
| Frontend hosting | Vercel |
| Backend hosting | Render |

---

## Deployment

The backend needs a persistent process (Socket.IO + 30s polling). Vercel only runs serverless functions, so the services are split:

| Service | Platform | Why |
|---|---|---|
| Frontend | Vercel | Static/SSR React, instant deploys |
| Backend | Render | Persistent Node.js, always-on, free tier |

See [DEPLOY.md](./DEPLOY.md) for full step-by-step instructions.

---

## Project Structure

```
/
├── src/                  # Frontend (React + TanStack)
│   ├── routes/           # Page routes (index, live, upcoming, recent, match.$id)
│   ├── components/       # UI components (AppLayout, Scoreboard, Flag, etc.)
│   └── lib/
│       ├── matches.ts    # Match TypeScript types
│       ├── api.ts        # REST API client → backend
│       └── socket.ts     # Socket.IO client → live updates
│
├── backend/              # Node.js backend (deploy to Render)
│   └── src/
│       ├── server.ts
│       ├── routes/       # Express routes
│       ├── controllers/  # Route controllers
│       ├── services/     # MatchEngine, MomentumEngine, MatchNormalizer
│       ├── txline/       # TxLINE API client
│       ├── ai/           # Groq/OpenAI insight generation
│       ├── sockets/      # Socket.IO service
│       └── types/        # Shared TypeScript types
│
├── render.yaml           # Render deployment config (backend)
├── vercel.json           # Vercel deployment config (frontend)
└── DEPLOY.md             # Full deployment guide
```

---

## Getting Started (Local)

### Prerequisites

- Node.js 18+
- A TxLINE API key and JWT from [TxOdds](https://txline.io)
- A Groq API key from [console.groq.com](https://console.groq.com) (free)

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Set up backend environment

```bash
cd backend
npm install
copy .env.example .env
```

Edit `backend/.env`:

```env
PORT=3001
TXLINE_BASE_URL=https://txline.txodds.com
TXLINE_JWT=your_guest_jwt
TXLINE_API_KEY=your_api_key
TXLINE_WC_COMPETITION_ID=72
GROQ_API_KEY=your_groq_key
NODE_ENV=development
```

> **Important:** Use `txline.txodds.com` (mainnet), not `txline-dev.txodds.com`.
> The devnet only exposes 2 fixtures and has no historical data.

### 3. Start both servers

**Terminal 1 — Frontend**
```bash
npm run dev
```
→ `http://localhost:5173`

**Terminal 2 — Backend**
```bash
cd backend
npm run dev
```
→ `http://localhost:3001`

---

## Backend API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/matches/live` | Live, upcoming, and recent matches |
| GET | `/matches/:id` | Full match detail |
| GET | `/matches/debug/snapshot` | Debug: engine state + TxLINE snapshot info |
| GET | `/health` | Backend health check |

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
- Built with: [Superteam](https://superteam.fun)
- AI: [Groq](https://groq.com) + Meta Llama 3.3
