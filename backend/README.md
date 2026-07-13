# Pulse Backend

This is the backend for Pulse, an AI-powered live football companion.
It fetches live data, processes events, generates real-time insights, and serves an API and Socket.IO connections.

## Tech Stack
- Node.js
- TypeScript
- Express
- Socket.IO
- Axios
- Zod
- OpenAI
- Winston

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and fill in the required keys.
   ```bash
   cp .env.example .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Folder Structure

- `src/controllers`: Express route controllers
- `src/routes`: API route definitions
- `src/services`: Core business logic (MatchEngine, MomentumEngine)
- `src/txline`: Service to interact with the TxLINE API
- `src/ai`: Service to interact with OpenAI for "Match Pulse" and Recaps
- `src/sockets`: Socket.IO implementation
- `src/middleware`: Express middlewares (Error handling, etc.)
- `src/utils`: Utilities like Winston logger
- `src/types`: TypeScript interfaces
- `src/config`: Environment variable validation
- `src/server.ts`: Application entry point

## API Endpoints

- `GET /matches/live` - Get all live matches
- `GET /matches/:id` - Get specific match details
- `GET /matches/:id/timeline` - Get match timeline events
- `GET /matches/:id/stats` - Get match statistics
- `GET /matches/:id/momentum` - Get current match momentum
- `GET /matches/:id/pulse` - Get AI generated match pulse
- `GET /matches/:id/recap` - Get AI generated match recap
- `GET /matches/:id/probability` - Get win probabilities

## Socket.IO Events

Clients can join a specific match room using `join_match` event and `matchId`.

Events broadcasted to the room:
- `score_updated`
- `timeline_updated`
- `stats_updated`
- `momentum_updated`
- `pulse_updated`
- `recap_updated`
- `match_finished`
