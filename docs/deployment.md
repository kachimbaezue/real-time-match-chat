# Deployment Guide

## Architecture

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel (static SPA) | https://pulse-omega-inky.vercel.app |
| Backend | Render (always-on Node.js) | https://real-time-match-chat.onrender.com |

The backend must be a persistent process — it holds Socket.IO connections and runs a polling loop. Vercel serverless functions spin down per-request and cannot support this.

---

## Backend — Render

### First-time setup

1. Go to [render.com](https://render.com), create a free account
2. **New → Web Service → Connect GitHub repo**
3. Set **Root Directory** to `backend`
4. Render auto-detects `render.yaml`. Confirm:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Runtime: Node
5. Add these **Environment Variables** in the Render dashboard:

```
NODE_ENV=production
PORT=3001
TXLINE_BASE_URL=https://txline.txodds.com
TXLINE_JWT=<your guest JWT from /auth/guest/start>
TXLINE_API_KEY=<your activated API token>
TXLINE_WC_COMPETITION_ID=72
GROQ_API_KEY=<your Groq key from console.groq.com>
NEWS_API_KEY=<your NewsAPI key>
```

> **Critical:** Use `https://txline.txodds.com` (mainnet), not `txline-dev.txodds.com`.
> Devnet has only 2 fixtures and no historical data.

6. Click **Deploy**
7. Copy your service URL (e.g. `https://pulse-backend.onrender.com`)

### Free tier keep-warm

Render free web services spin down after 15 min of inactivity (first request after sleep takes ~30s). Options:
- **UptimeRobot** (free) — ping `/health` every 5 minutes
- **Render Starter plan** ($7/mo) — always on, no cold starts

### Redeployment

Push to `main` — Render auto-deploys. Or trigger manually from the Render dashboard.

---

## Frontend — Vercel

### First-time setup

1. Go to [vercel.com](https://vercel.com), import the GitHub repo
2. Set **Environment Variables**:
```
VITE_API_URL=https://real-time-match-chat.onrender.com
VITE_SOCKET_URL=https://real-time-match-chat.onrender.com
```
3. Vercel uses `vercel.json` which sets:
   - `buildCommand: "npm run build:vercel"`
   - `outputDirectory: ".vercel/output"`
   - `framework: null`
4. The build script (`scripts/build-vercel.mjs`) runs `vite build --config vite.config.spa.ts` then copies the output to `.vercel/output/static/` with SPA routing fallback.

### What `build:vercel` does

```
npm run build:vercel
  → vite build --config vite.config.spa.ts
      uses @vitejs/plugin-react (no SSR)
      entry: index.html → src/entry-client.tsx
      output: dist/spa/
  → node scripts/build-vercel.mjs
      copies dist/spa/ → .vercel/output/static/
      writes .vercel/output/config.json (SPA routing fallback)
```

The build produces a pure static SPA — no server-side rendering. All data fetching happens client-side via `useEffect` calls to the Render backend.

### Redeployment

Push to `main` — Vercel auto-deploys. Or trigger manually from the Vercel dashboard.

---

## Local Development

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev          # tsx watch src/server.ts → localhost:3001

# Terminal 2 — frontend
npm install
npm run dev          # vite dev → localhost:5173
```

The local `.env` already points at the Render backend:
```
VITE_API_URL=https://real-time-match-chat.onrender.com
VITE_SOCKET_URL=https://real-time-match-chat.onrender.com
```

To run against local backend instead, swap to:
```
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

---

## Environment Variables Reference

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend REST base URL |
| `VITE_SOCKET_URL` | Backend WebSocket URL (same host) |

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default 3001) |
| `NODE_ENV` | `development` or `production` |
| `TXLINE_BASE_URL` | TxLINE API base URL — **use `https://txline.txodds.com`** |
| `TXLINE_JWT` | Guest JWT from `POST /auth/guest/start` (30-day TTL) |
| `TXLINE_API_KEY` | Activated API token from on-chain Solana subscription |
| `TXLINE_WC_COMPETITION_ID` | `72` (FIFA World Cup 2026) |
| `GROQ_API_KEY` | Free key from [console.groq.com](https://console.groq.com) |
| `OPENAI_API_KEY` | Optional OpenAI fallback |
| `NEWS_API_KEY` | NewsAPI key for World Cup news feed |

---

## Debugging

### Check backend is alive
```
GET https://real-time-match-chat.onrender.com/health
→ { "status": "ok", "timestamp": "..." }
```

### Inspect engine state
```
GET https://real-time-match-chat.onrender.com/matches/debug/snapshot
→ total/live/upcoming/recent counts + sample data
```

### Check TxLINE is working
```
GET https://real-time-match-chat.onrender.com/matches/live
→ { live: [...], upcoming: [...], recent: [...] }
```
If `upcoming` and `recent` are populated, TxLINE data is flowing.
