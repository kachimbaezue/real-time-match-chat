# Deployment Guide

## Why two services?

The backend is a persistent Node.js server (Express + Socket.IO + 30s polling loop).  
Vercel runs **serverless functions** — no persistent processes. It cannot host the backend.

**Solution:**
- **Backend → Render** (free tier, always-on Node.js server)
- **Frontend → Vercel** (static/SSR React app)

---

## 1. Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign in (free account)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Render will auto-detect the `render.yaml` — confirm these settings:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Runtime: Node
6. Add these **Environment Variables** in Render dashboard:
   ```
   NODE_ENV=production
   PORT=3001
   TXLINE_BASE_URL=https://txline.txodds.com
   TXLINE_JWT=<your jwt>
   TXLINE_API_KEY=<your api key>
   TXLINE_WC_COMPETITION_ID=72
   GROQ_API_KEY=<your groq key>
   ```
7. Click **Deploy**. Once live, copy your service URL (e.g. `https://pulse-backend.onrender.com`)

> **Free tier note:** Render free web services spin down after 15 min of inactivity.  
> Upgrade to the $7/mo "Starter" plan for always-on, or use a free uptime monitor  
> (e.g. UptimeRobot pinging `/health` every 5 min to keep it warm).

---

## 2. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and import your repo
2. Set these **Environment Variables** in Vercel dashboard:
   ```
   VITE_API_URL=https://pulse-backend.onrender.com
   VITE_SOCKET_URL=https://pulse-backend.onrender.com
   ```
3. Framework preset: **Vite** (or leave auto-detect)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

---

## 3. Debug Recent Matches

If Recent still shows empty after deployment, hit this endpoint to inspect the engine state:

```
GET https://pulse-backend.onrender.com/matches/debug/snapshot
```

This returns:
- How many fixtures are in memory (total / live / upcoming / recent)
- How many World Cup fixtures the snapshot returns
- How many are detected as finished
- Sample finished fixture data

---

## Local Dev

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend  
npm run dev
```

Frontend at `http://localhost:5173`, backend at `http://localhost:3001`.
