# Pulse — Technical Documentation

**Pulse** is an AI-powered second-screen companion for the 2026 FIFA World Cup.  
It transforms live TxLINE sports data into real-time narratives — so fans understand the *game*, not just the score.

Built for the **TxLINE × Superteam World Cup Hackathon**.

---

## Contents

| File | Description |
|---|---|
| [architecture.md](./architecture.md) | Full system architecture, data pipeline, service map |
| [txline-integration.md](./txline-integration.md) | Every TxLINE endpoint used, auth flow, data normalisation |
| [api-reference.md](./api-reference.md) | All backend REST endpoints and Socket.IO events |
| [ai-features.md](./ai-features.md) | AI features, prompts, models, fallback logic |
| [deployment.md](./deployment.md) | Render + Vercel deployment guide, env vars |
| [monetization.md](./monetization.md) | Business model and commercial path |
| [txline-feedback.md](./txline-feedback.md) | TxLINE API experience and feedback for the TxODDS team |

---

## Quick Facts

| | |
|---|---|
| **Live URL** | https://pulse-omega-inky.vercel.app |
| **Backend** | https://real-time-match-chat.onrender.com |
| **Data source** | TxLINE by TxOdds (`txline.txodds.com`) |
| **Subscription** | Signed up via Solana on-chain transaction (free hackathon tier) |
| **AI model** | Groq `llama-3.3-70b-versatile` (primary), OpenAI `gpt-4o-mini` (fallback) |
| **Stack** | React 19, TanStack Router, Express, Socket.IO, TailwindCSS v4 |
| **Repo** | Public GitHub repo |

---

## TxLINE Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /api/fixtures/snapshot` | Load all World Cup fixtures (live, upcoming, finished) |
| `GET /api/scores/snapshot/:fixtureId` | Full event log for any fixture |
| `GET /api/scores/updates/:fixtureId` | Live score events for in-progress matches |
| `GET /api/scores/historical/:fixtureId` | Completed fixture history (older than 6h) |
| `POST /auth/guest/start` | Obtain/renew guest JWT |
