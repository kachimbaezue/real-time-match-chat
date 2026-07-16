# Pages and TxLINE Integration Documentation

## Overview
This document outlines the structure of the Pulse application, the data flow from TxLINE APIs, and how each page integrates with the backend and real-time data.

## Project Structure
- **Frontend**: React + TypeScript, TanStack Router, Vite
- **Backend**: Node.js + Express, Socket.IO, TxLINE API Client
- **Data Source**: TxLINE API for live match data, fixtures, and scores

## Pages & Their Data Requirements

### 1. Home Page (`/` - src/routes/index.tsx)
- **Purpose**: Landing page showing live matches, upcoming matches, and recent results
- **Data Source**: `/matches/live` backend endpoint
- **TxLINE APIs Used**: 
  - `/api/fixtures/snapshot` - for all fixture data (live, upcoming, recent)
- **Real-time Updates**: Socket.IO events for score changes, match status updates

### 2. Hot Page (`/hot` - src/routes/hot.tsx)
- **Purpose**: Real-time "spaghetti" style thread of match events (goals, cards, AI insights)
- **Data Source**: `/hot` backend endpoint
- **TxLINE APIs Used**: 
  - `/api/fixtures/snapshot` - to get match context
  - `/api/scores/updates/:fixtureId` - for live score events
- **Features**:
  - No emoji usage (icons instead)
  - No demo/dummy data - all events derived from TxLINE data
  - Auto-updates every 20 seconds
  - Filterable by event type (goals, cards, AI insights, live)

### 3. Live Page (`/live` - src/routes/live.tsx)
- **Purpose**: Display all currently live matches
- **Data Source**: `/matches/live` backend endpoint
- **TxLINE APIs Used**: `/api/fixtures/snapshot`

### 4. Upcoming Page (`/upcoming` - src/routes/upcoming.tsx)
- **Purpose**: Display upcoming matches
- **Data Source**: `/matches/live` backend endpoint
- **TxLINE APIs Used**: `/api/fixtures/snapshot`

### 5. Recent Page (`/recent` - src/routes/recent.tsx)
- **Purpose**: Display recently completed matches
- **Data Source**: `/matches/live` backend endpoint
- **TxLINE APIs Used**: `/api/fixtures/snapshot`

### 6. Match Detail Page (`/match/:id` - src/routes/match.$id.tsx)
- **Purpose**: Comprehensive view of a single match
- **Data Source**: 
  - `/matches/:id` - initial data
  - Socket.IO for real-time updates
- **TxLINE APIs Used**:
  - `/api/fixtures/snapshot` - fixture details
  - `/api/scores/snapshot/:fixtureId` - full score history
  - `/api/scores/updates/:fixtureId` - live updates
- **Features**:
  - No demo data
  - Match Pulse (AI insights) toggleable
  - Timeline of events (from TxLINE)
  - Win probability
  - Stats, momentum, joined now summary
  - Match replay (for finished matches)

## Backend Architecture

### TxLINE Client (`backend/src/txline/TxLineClient.ts`)
- **Purpose**: Wraps all TxLINE API calls
- **Endpoints Used**:
  1. `GET /api/fixtures/snapshot` - Fetch all available fixtures
  2. `GET /api/scores/snapshot/:fixtureId` - Get full score history for a fixture
  3. `GET /api/scores/updates/:fixtureId` - Get live score updates
  4. `GET /api/scores/historical/:fixtureId` - Get historical scores (older fixtures)
  5. `POST /auth/guest/start` - Refresh guest JWT token (as needed)
- **Data Transformation**: Converts TxLINE's PascalCase format to camelCase for internal use

### Match Engine (`backend/src/services/MatchEngine.ts`)
- **Purpose**: Manages real-time state of all matches
- **Responsibilities**:
  - Polls TxLINE APIs for updates
  - Normalizes and processes raw data
  - Emits Socket.IO events for real-time frontend updates
  - Generates Match Pulse (AI insights) based on match events
  - Calculates momentum, win probability, and other derived metrics
- **Update Frequency**: Configurable (default every few seconds for live matches)

### Controllers
- **MatchController (`backend/src/controllers/MatchController.ts`)**:
  - `GET /matches/live` - Returns live, upcoming, recent matches
  - `GET /matches/:id` - Returns single match details
  - `GET /matches/debug/snapshot` - Debug endpoint for raw TxLINE data
- **HotController (`backend/src/controllers/HotController.ts`)**:
  - `GET /hot` - Returns aggregated match events for the hot page

### Socket Service (`backend/src/sockets/SocketService.ts`)
- **Purpose**: Handles real-time WebSocket communication with frontend
- **Events Emitted**:
  - `scoreUpdate`
  - `statsUpdate`
  - `timelineUpdate`
  - `momentumUpdate`
  - `matchPulseUpdate`
  - `winProbabilityUpdate`
  - `joinedNowUpdate`
  - `matchFinished`

## Data Pipeline

### TxLINE → Backend
1. TxLINE Client fetches raw data from TxLINE APIs
2. Match Normalizer transforms raw TxLINE data into internal MatchState format
3. Match Engine processes normalized data, updates internal state, and calculates derived metrics (AI Pulse, momentum, etc.)
4. Socket Service emits events for any state changes

### Backend → Frontend
1. Frontend makes initial HTTP GET request to load page
2. Frontend connects to Socket.IO and subscribes to match-specific events
3. When Socket events are received, frontend updates local state and re-renders UI
4. No fallback/demo data is used - all data comes directly from TxLINE

## Key Design Decisions
1. **No Demo/Fallback Data**: All data must come from TxLINE API
2. **Icons Over Emojis**: All UI uses Hugeicons instead of emojis
3. **Real-time First**: Leverages Socket.IO for instant updates, with HTTP polling as backup
4. **Clean Architecture**: Business logic isolated in services, APIs separated from controllers
5. **Type Safety**: Full TypeScript coverage from backend to frontend
