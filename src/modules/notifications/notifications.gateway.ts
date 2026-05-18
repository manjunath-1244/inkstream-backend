import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: true,
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger('NotificationsGateway');
  private readonly clients = new Map<string, Socket>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      let token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization ||
        client.handshake.query?.token;

      if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.slice(7);
      }

      if (!token || typeof token !== 'string') {
        this.logger.warn(
          `Connection rejected: No token provided (Socket: ${client.id})`,
        );
        client.disconnect();
        return;
      }

      const decoded = await this.jwtService.verifyAsync(token);
      const userId = decoded.sub;

      if (!userId) {
        this.logger.warn(
          `Connection rejected: Invalid payload sub (Socket: ${client.id})`,
        );
        client.disconnect();
        return;
      }

      this.clients.set(userId, client);
      this.logger.log(
        `User ${userId} successfully connected to WebSockets (Socket: ${client.id})`,
      );
    } catch (error: any) {
      this.logger.error(
        `Connection rejected: Authentication failed. Socket ID: ${client.id}, Error: ${error?.message as string}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socket] of this.clients.entries()) {
      if (socket.id === client.id) {
        this.clients.delete(userId);
        this.logger.log(`User ${userId} disconnected from WebSockets`);
        break;
      }
    }
  }

  /**
   * Pushes a notification payload to a connected user's WebSocket client in real-time.
   * @param recipientId The user ID to send the notification to.
   * @param payload The notification payload to emit.
   */
  sendNotificationToUser(recipientId: string, payload: any): boolean {
    const client = this.clients.get(recipientId);
    if (client) {
      client.emit('notification', payload);
      this.logger.log(`Pushed real-time notification to user ${recipientId}`);
      return true;
    }
    this.logger.log(`User ${recipientId} is offline, skipped real-time push`);
    return false;
  }
}
