# Pulse

A second-screen football companion for the FIFA World Cup 2026.

Pulse explains the story of a match in real time — so you understand the game, not just the score. Powered by live data from the TxLINE API and AI-generated insights.

Built for the **World Cup Hackathon** by [@superteamNG](https://superteam.fun) and [@TXODDSOfficial](https://txline.io).

---

## What it does

- Live scoreboard with broadcast-style display
- Match Pulse — AI-written explanation of what's happening and why
- If You Joined Now — a real-time catch-up recap for late viewers
- Momentum engine — shows which team currently controls the game
- Win probability, live stats, and full match timeline
- Match replay for finished games

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TanStack Router, TanStack Start, Tailwind CSS v4 |
| Backend | Node.js, TypeScript, Express, Socket.IO |
| Live data | TxLINE API (by TxOdds) |
| AI insights | OpenAI |

---

## Project Structure

```
/
├── src/                  # Frontend (React + TanStack)
│   ├── routes/           # Page routes (index, match.$id)
│   ├── components/       # UI components (AppLayout, Scoreboard, etc.)
│   └── lib/
│       ├── matches.ts    # Static mock data (used when backend is offline)
│       ├── api.ts        # REST API client → backend
│       └── socket.ts     # Socket.IO client → live updates
│
└── backend/              # Node.js backend
    └── src/
        ├── server.ts
        ├── routes/       # Express routes
        ├── controllers/  # Route controllers
        ├── services/     # MatchEngine, MomentumEngine
        ├── txline/       # TxLINE API integration
        ├── ai/           # OpenAI insight generation
        ├── sockets/      # Socket.IO service
        └── types/        # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A TxLINE API key from [TxOdds](https://txline.io)
- An OpenAI API key

---

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

Open `backend/.env` and fill in your keys:

```env
PORT=3001
TXLINE_API_KEY=your_txline_api_key
TXLINE_BASE_URL=https://txline.txodds.com
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
```

### 3. Set up frontend environment

A `.env` file is already at the root with the defaults:

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

---

### 4. Start both servers

Open **two terminals**.

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

The frontend tries the backend API first and automatically falls back to static mock data if the backend isn't running.

---

## Backend API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/matches/live` | Live, upcoming, and recent matches |
| GET | `/matches/:id` | Full match detail |
| GET | `/health` | Backend health check |

## Socket.IO Events

The frontend subscribes to these events per match:

| Event | Payload |
|---|---|
| `scoreUpdated` | `{ matchId, homeScore, awayScore, minute }` |
| `statsUpdated` | `{ matchId, stats }` |
| `timelineUpdated` | `{ matchId, event }` |
| `momentumUpdated` | `{ matchId, momentum }` |
| `matchPulseUpdated` | `{ matchId, pulse, headline }` |
| `winProbabilityUpdated` | `{ matchId, winProbability }` |
| `joinedNowUpdated` | `{ matchId, joinedNow }` |
| `matchFinished` | `{ matchId, homeScore, awayScore, turningPoints }` |

---

## Offline / Demo Mode

If the backend is not running, the app uses static mock data from `src/lib/matches.ts` — all UI features work, including match pages, pulse, timeline, replay, and momentum.

---

## Credits

- Live data: [TxLINE by TxOdds](https://txline.io)
- Built with: [Superteam](https://superteam.fun)
