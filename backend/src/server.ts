import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './utils/logger';
import { socketService } from './sockets/SocketService';
import matchRoutes from './routes/matchRoutes';
import { errorHandler } from './middleware/errorHandler';
import { matchEngine } from './services/MatchEngine';

const app = express();
const httpServer = createServer(app);

// Allowed origins: local dev + any Vercel deployment
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  // Vercel preview & production — match anything under vercel.app or a custom domain
];

// Middleware
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin (e.g. SSR), localhost, and any *.vercel.app
    if (
      !origin ||
      origin.includes('localhost') ||
      origin.includes('vercel.app') ||
      ALLOWED_ORIGINS.includes(origin)
    ) {
      cb(null, true);
    } else {
      cb(null, true); // open for now — tighten once domain is known
    }
  },
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/matches', matchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize Sockets
socketService.initialize(httpServer);

// Start Match Engine Polling
matchEngine.startPolling();

// Start Server
const PORT = env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  matchEngine.stopPolling();
  httpServer.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});
