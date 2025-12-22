// src/game/game.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import * as gameService from './game.service';
import { Logger, OnModuleInit } from '@nestjs/common';
import type { TankInput } from './model/Tank';
import type { BulletInput } from './model/Bullet';
import { sessionStore } from 'src/auth/session.store';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(private readonly gameService: gameService.GameService) {}

  onModuleInit() {
    // Cung cấp instance của Socket.io Server cho Game Service
    this.gameService.setServer(this.server);
  }

  // Xử lý khi Client kết nối
  handleConnection(@ConnectedSocket() client: Socket) {
    // Lấy thông tin username từ sessionStore
    const sessionId = client.handshake.auth.sessionId;
    const sessionVal = sessionStore.get(sessionId);

    // Nếu không tìm thấy session, từ chối kết nối
    if (!sessionVal) {
      this.logger.warn(`Invalid session for client: ${client.id}`);
      client.disconnect();
      return;
    }

    const username = sessionVal.username;

    this.logger.log(
      `Client connected: ${client.id} (User: ${username}, Session: ${sessionId})`
    );

    this.gameService.addPlayer(client.id, username, sessionId);
  }


  // Xử lý khi Client ngắt kết nối
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // Chỉ xóa khỏi map tạm thời, Session vẫn giữ trong Service
    this.gameService.removePlayer(client.id);
  }

  // Lắng nghe input di chuyển từ Client
  // Dữ liệu client gửi lên: socket.emit('playerInput', { direction: 'right' });
  @SubscribeMessage('tankInput')
  handleMove(@MessageBody() tankInput: TankInput, @ConnectedSocket() client: Socket): void {
    this.gameService.handleTankInput(client.id, tankInput);
  }
}
