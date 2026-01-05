/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

//   @SubscribeMessage("gain_xp")
// handleGainXp(@MessageBody() data: { playerId: string; xp: number }) {
//   console.log(
//     `Received gain_xp for player ${data.playerId} with xp ${data.xp}`
//   );
//   this.gameService.addXp(data.playerId, data.xp);
// }

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

    if (sessionVal.socketId && sessionVal.socketId !== client.id) {
        this.server.sockets.sockets
        .get(sessionVal.socketId)
        ?.disconnect(true);
    }
    sessionVal.socketId = client.id;

    sessionStore.set(sessionId, sessionVal);

    const username = sessionVal.username;
    const skin = sessionVal.skin;

    this.logger.log(`Client connected: ${client.id} (User: ${username}, Session: ${sessionId}), Skin : ${skin}` );
    this.gameService.addPlayer(client.id, username, sessionId, skin);
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
    // console.log("🔥 TANK INPUT RECEIVED", client.id, tankInput);
    this.gameService.handleTankInput(client.id, tankInput);
  }

  @SubscribeMessage("ping")
handlePing(@MessageBody() clientTime: number) {
  return {
    event: "pong",
    data: Date.now(),
  };
}
}
