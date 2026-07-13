import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export class SocketService {
  private io: SocketIOServer | null = null;

  initialize(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('join_match', (matchId: string) => {
        socket.join(`match_${matchId}`);
        logger.info(`Client ${socket.id} joined match_${matchId}`);
      });

      socket.on('leave_match', (matchId: string) => {
        socket.leave(`match_${matchId}`);
        logger.info(`Client ${socket.id} left match_${matchId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  broadcastToMatch(matchId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`match_${matchId}`).emit(event, data);
    }
  }

  broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
