# Pulse — Real-Time Match Chat & AI Insights
*A detailed, technical guide to every part of the application*

---

## Table of Contents
1. [Project Structure Overview](#project-structure-overview)
2. [Frontend Deep Dive](#frontend-deep-dive)
3. [Backend Deep Dive](#backend-deep-dive)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Data Flow: From TxLINE API to Frontend](#data-flow-from-txline-api-to-frontend)
6. [Third-Party Integrations](#third-party-integrations)
7. [Deployment Guide](#deployment-guide)
8. [Known Limitations & Future Work](#known-limitations--future-work)

---

## Project Structure Overview
```
real-time-match-chat-main/
├── src/                          # Frontend (React + Vite + TanStack Router)
│   ├── components/               # Reusable UI components
│   │   ├── AppLayout.tsx         # Main app layout, sidebar, top bar, search modal
│   │   ├── Flag.tsx              # Country flag display
│   │   ├── Scoreboard.tsx        # Match scoreboard component
│   │   └── SkeletonLoader.tsx    # Loading skeletons
│   ├── lib/                      # Frontend utilities
│   │   ├── api.ts                # API client for backend
│   │   ├── matches.ts            # Type definitions for frontend match data
│   │   └── socket.ts             # Socket.IO client setup
│   ├── routes/                   # Page components
│   │   ├── index.tsx             # Home page (matches list)
│   │   ├── hot.tsx               # Hot feed (match events + news)
│   │   └── match.$id.tsx         # Match detail page
│   └── main.tsx                  # Frontend entry point
├── backend/                      # Backend (Express + Socket.IO + TypeScript)
│   ├── src/
│   │   ├── config/               # Configuration
│   │   │   └── env.ts            # Zod schema for environment variables + dotenv setup
│   │   ├── controllers/          # Request handlers
│   │   │   └── MatchController.ts # Match API endpoints + debug tools
│   │   ├── routes/               # Express routers
│   │   │   ├── matchRoutes.ts    # Match-related API routes
│   │   │   └── hotRoutes.ts      # Hot feed API routes
│   │   ├── services/             # Business logic
│   │   │   ├── AIService.ts      # AI generation (match pulse, recap, turning points)
│   │   │   ├── MatchEngine.ts    # Core match management & real-time polling
│   │   │   ├── MatchNormalizer.ts # TxLINE raw data → internal MatchState conversion
│   │   │   ├── MomentumEngine.ts # Momentum score calculation from stats
│   │   │   └── NewsAPIClient.ts  # NewsAPI client for fetching World Cup news
│   │   ├── sockets/              # Socket.IO logic
│   │   │   └── SocketService.ts  # Socket.IO server setup & event broadcasting
│   │   ├── txline/               # TxLINE API integration
│   │   │   └── TxLineClient.ts   # Axios client for TxLINE API
│   │   ├── types/                # TypeScript type definitions
│   │   │   └── index.ts          # Core types (MatchState, TimelineEvent, etc.)
│   │   ├── utils/                # Utilities
│   │   │   └── logger.ts         # Winston logger setup
│   │   └── server.ts             # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── hackton-info-and-rule.md      # Hackathon rules & requirements
├── monetization-plan.md          # Detailed monetization strategy
└── PAGES_AND_TXLINE.md           # Page-by-page data source breakdown
```

---

## Frontend Deep Dive

### Pages Breakdown
| Page | Route | File | Description |
|------|-------|------|-------------|
| Home | `/` | [src/routes/index.tsx](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/src/routes/index.tsx) | Shows live, upcoming, and recent matches |
| Hot Feed | `/hot` | [src/routes/hot.tsx](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/src/routes/hot.tsx) | Spaghetti-style live feed of match events + verified World Cup news |
| Match Detail | `/match/$id` | [src/routes/match.$id.tsx](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/src/routes/match.$id.tsx) | Detailed match page with scoreboard, AI pulse, stats, timeline, and replay |

### AppLayout & Navigation
The main app layout ([src/components/AppLayout.tsx](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/src/components/AppLayout.tsx)) includes:
- Collapsible sidebar with navigation links
- Top bar with search (opens a search modal to find matches)
- Built with Hugeicons-react for all UI icons

### Hot Feed Page (src/routes/hot.tsx)
Key Features:
- **News Integration**: Fetches verified World Cup news from NewsAPI (via backend)
- **Expandable News Descriptions**: If a news description is longer than 100 characters, it is truncated with a "Show more"/"Show less" button
- **No "Read More" Links**: Removed direct links to news sources
- **Spaghetti Thread Style**: Vertical timeline of events ordered by time descending
- **Filter Pills**: Filter feed by type (all, goals, cards, AI, live, news)

---

## Backend Deep Dive

### Core Services Breakdown

#### 1. MatchEngine ([backend/src/services/MatchEngine.ts](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/backend/src/services/MatchEngine.ts))
The "brain" of the backend:
- **Polling**:
  - Full fixture snapshot poll every 30 seconds to discover new matches
  - Fast live-match poll every 10 seconds (using TxLINE scores snapshot) for live events
- **Known Finished Fixtures**: Hardcoded list of historic matches (e.g., England vs Argentina 18241006) that are no longer in TxLINE's active snapshot
- **AI Generation**:
  - Generates match pulse, recap, and turning points when a match finishes
  - Generates periodic pulse updates during live matches (every 5 minutes)
- **Socket.IO Broadcasting**: Emits real-time events when match data changes
- **State Management**: Maintains an in-memory map of `MatchState` objects for all tracked fixtures

#### 2. MatchNormalizer ([backend/src/services/MatchNormalizer.ts](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/backend/src/services/MatchNormalizer.ts))
Converts raw TxLINE PascalCase data to our internal `MatchState` format:
- **Stats Normalization**:
  - Prioritizes TxLINE 3000-series keys for shots, shots on target, and fouls (most accurate)
  - Falls back to counting events if 3000-series keys aren't available
  - Uses Stats keys 7/8 for corners, 3/4/5/6 for cards
  - **Possession Fix**: Defaults to 50/50 if fewer than 5 possession events are found (fix for skewed data from sparse events)
- **Timeline Normalization**: Filters TxLINE events to only relevant types (goal, yellow card, red card, substitution, corner, status update)
- **Status Conversion**: Maps TxLINE StatusId (1=pre,2=1H,3=HT,4=2H,5=FT,7=ET1,8=HTET,9=ET2,10=FET,12=Penalties,100=GameFinalized) to our internal `MatchStatus` enum

#### 3. AIService ([backend/src/services/AIService.ts](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/backend/src/services/AIService.ts))
Uses LLMs to generate AI insights from TxLINE data only (no external data sources):
- Requires either `GROQ_API_KEY` or `OPENAI_API_KEY` in environment variables
- `generateMatchPulse()`: Creates concise, live match insights
- `generateMatchRecap()`: Generates a summary of what you missed if you joined late
- `generateTurningPoints()`: Lists 3-5 key moments that changed the match
- `calculateWinProbability()`: Simple heuristic based on score, time remaining, and stats (no ML model)

#### 4. NewsAPIClient ([backend/src/services/NewsAPIClient.ts](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/backend/src/services/NewsAPIClient.ts))
Fetches verified World Cup news from NewsAPI:
- Requires `NEWS_API_KEY` in backend/.env
- `fetchWorldCupNews()`: Queries NewsAPI's /everything endpoint with keywords "World Cup 2026", language=en, sorted by publishedAt

#### 5. TxLineClient ([backend/src/txline/TxLineClient.ts](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/backend/src/txline/TxLineClient.ts))
Axios client for interacting with the TxLINE API:
- Requires both `TXLINE_JWT` (guest JWT from TxLINE /auth/guest/start) and `TXLINE_API_KEY` (activated API token)
- Endpoints used:
  - `/api/fixtures/snapshot`: Get all available fixtures
  - `/api/scores/snapshot/:fixtureId`: Get full event stream for a fixture
  - `/api/scores/historical/:fixtureId`: Get historic data for finished fixtures
  - `/auth/guest/start`: Renew guest JWT (not currently auto-renewed)

---

## API Endpoints Reference

### Match Endpoints ([backend/src/routes/matchRoutes.ts](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/backend/src/routes/matchRoutes.ts))
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/matches/live` | GET | Returns live, upcoming, and recent matches |
| `/matches/debug/snapshot` | GET | Debug endpoint: Returns TxLINE snapshot + MatchEngine state |
| `/matches/debug/fixture/:id` | GET | Debug endpoint: Returns raw TxLINE data vs normalized data for a single fixture |
| `/matches/:id` | GET | Returns full match data (score, stats, timeline, etc.) for frontend |
| `/matches/:id/timeline` | GET | Returns only match timeline |
| `/matches/:id/stats` | GET | Returns only match stats |
| `/matches/:id/momentum` | GET | Returns only momentum score |
| `/matches/:id/pulse` | GET | Returns only AI match pulse |
| `/matches/:id/recap` | GET | Returns only match recap |
| `/matches/:id/probability` | GET | Returns only win probabilities |

### Hot Feed Endpoints ([backend/src/routes/hotRoutes.ts](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/backend/src/routes/hotRoutes.ts))
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hot` | GET | Returns combined feed of match events + World Cup news |

### Socket.IO Events ([backend/src/sockets/SocketService.ts](file:///c:/Users/kachiluiz/Desktop/projects/real-time-match-chat-main/backend/src/sockets/SocketService.ts))
Real-time events pushed from server to client:
| Event Name | Payload |
|------------|---------|
| `scoreUpdated` | `{ matchId, homeScore, awayScore, minute }` |
| `statsUpdated` | `{ matchId, stats }` |
| `timelineUpdated` | `{ matchId, event }` |
| `momentumUpdated` | `{ matchId, momentum }` |
| `matchPulseUpdated` | `{ matchId, pulse, headline }` |
| `winProbabilityUpdated` | `{ matchId, winProbability }` |
| `matchFinished` | `{ matchId, homeScore, awayScore, turningPoints }` |

---

## Data Flow: From TxLINE API to Frontend
Here is the step-by-step journey of data from TxLINE to your screen:
1. **TxLINE API Polling**: MatchEngine calls TxLineClient.getFixtures() every 30s to get all fixtures
2. **Score Snapshot Fetch**: For each fixture of interest, MatchEngine fetches the full score snapshot with TxLineClient.getScoresSnapshot()
3. **Normalization**: MatchNormalizer.normalize() converts raw TxLINE PascalCase data to our internal MatchState format
4. **AI Insights (if applicable)**: If match is live or just finished, AIService generates insights
5. **Socket Broadcast**: If anything changed, SocketService broadcasts update events to connected clients
6. **Frontend API Fetch**: On initial page load, frontend fetches data via lib/api.ts
7. **Frontend Socket Updates**: Socket.IO client (lib/socket.ts) listens for real-time events and updates local state without a page reload

---

## Third-Party Integrations
| Service | Purpose | Required Env Vars |
|---------|---------|------------------|
| TxLINE API | Live and historic match data | TXLINE_JWT, TXLINE_API_KEY (both required for full functionality) |
| NewsAPI | World Cup news for hot feed | NEWS_API_KEY (optional, skips news fetch if not set) |
| Groq / OpenAI | AI insights (match pulse, recap, turning points) | GROQ_API_KEY (preferred, free) or OPENAI_API_KEY (optional, AI is skipped if no key) |
| Vercel / Render (optional) | Backend hosting (for production) | N/A |
| Firebase Hosting (optional) | Frontend hosting for clean *.web.app domain | N/A |

---

## Deployment Guide

### Frontend Deployment to Firebase Hosting (for *.web.app Domain)
Firebase Hosting is perfect for static frontend hosting with fast CDNs:
1. **Create Firebase Project**: Go to [console.firebase.google.com](https://console.firebase.google.com), create a new project
2. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
3. **Initialize Firebase in Frontend**:
   ```bash
   # From project root (or frontend directory if you split them later)
   firebase init
   ```
   - Select **Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys**
   - Select your Firebase project
   - Set **public directory** to `dist` (frontend build output)
   - Configure as a **single-page app**: Yes
   - Don't overwrite index.html
4. **Build Frontend**:
   ```bash
   npm run build
   ```
5. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```
   Your app will now be live at `your-project-id.web.app`!

### Backend Deployment Options
Your backend is an Express server with Socket.IO—here are your options:

#### Option A: Vercel (Recommended if Possible)
Yes, you CAN deploy your backend to Vercel! But there are **important caveats for Socket.IO**:
1. **Vercel Limitations for Socket.IO**:
   - Vercel's serverless functions have cold starts
   - WebSockets are supported on Vercel Pro and Enterprise plans, or on Hobby plans using the `@vercel/node` adapter (but with limitations on connection duration)
   - Our MatchEngine uses in-memory state—if Vercel scales to multiple instances, state will not be shared (you'd need Redis or Firebase Realtime Database for shared state in that case)

**Steps to Deploy Backend to Vercel**:
1. **Create a Vercel Project**: Go to [vercel.com](https://vercel.com), create a new project, connect to your GitHub repo
2. **Set Environment Variables**: In Vercel project settings, add all backend env vars:
   - `PORT`
   - `TXLINE_JWT`
   - `TXLINE_API_KEY`
   - `TXLINE_BASE_URL`
   - `TXLINE_WC_COMPETITION_ID`
   - `NEWS_API_KEY`
   - `GROQ_API_KEY` or `OPENAI_API_KEY`
3. **Add vercel.json to Backend Directory**:
   Create `backend/vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "src/server.ts", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "src/server.ts" }
     ]
   }
   ```
4. **Optional: Connect Frontend & Backend**:
   If you want everything under your Firebase Hosting domain, set up a **Firebase Hosting rewrite** to proxy API requests to your Vercel backend:
   Edit `firebase.json`:
   ```json
   {
     "hosting": {
       "public": "dist",
       "rewrites": [
         { "source": "/api/**", "destination": "https://your-vercel-backend.vercel.app/api" },
         { "source": "**", "destination": "/index.html" }
       ]
     }
   }
   ```

#### Option B: Render (Fallback for Better Socket.IO Support)
If you have issues with Vercel/Socket.IO, Render has **native WebSocket support** and a generous free tier:
1. Go to [render.com](https://render.com), create a new Web Service
2. Connect your repo, set root directory to `backend`
3. Set build command to `npm install && npm run build`
4. Set start command to `npm start`
5. Add all environment variables in Render settings
6. Deploy! Then set up Firebase Hosting rewrites as in Option A to proxy to your Render backend

---

## Known Limitations & Future Work
1. **MatchEngine State is In-Memory**: If backend restarts, all in-memory state resets (would need Redis for persistence)
2. **TxLINE Guest JWT Expires**: JWT expires every 30 days—currently no auto-renewal
3. **Possession Calculation is Limited**: Only counts possession events if enough data is available, else defaults to 50/50
4. **NewsAPI Rate Limits**: NewsAPI free tier has rate limits—would need to add caching in production
5. **Team Short Code Map is Hardcoded**: TEAM_SHORT map in MatchController.ts needs manual updates if new teams are added

---

## Quick Start (Local Development)
1. **Set Up Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env to add your API keys!
   npm run dev
   ```
2. **Set Up Frontend**:
   ```bash
   cd ..
   npm install
   npm run dev
   ```
