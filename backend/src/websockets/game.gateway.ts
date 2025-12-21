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
    const sessionId = client.handshake.auth.sessionId; // Lấy "Thẻ căn cước"
    this.logger.log(`Client connected: ${client.id} (Session: ${sessionId})`);

    if (sessionId) {
        const restoredTank = this.gameService.restoreSession(sessionId, client.id);
        
        if (restoredTank) {
            this.logger.log(`-> Welcome back ${restoredTank.name}!`);

            client.emit('sessionRestored', { 
                name: restoredTank.name,
                tank: restoredTank
            });

            client.emit('mapData', { map: this.gameService.getMap() });
            
            return;
        }
    }

    this.logger.log(`-> New visitor waiting to register...`);
  }

  @SubscribeMessage('registerName')
  handleRegisterName(
    @ConnectedSocket() client: Socket, 
    @MessageBody() payload: { name: string }
  ) {
    const sessionId = client.handshake.auth.sessionId;

    if (!this.gameService.getTank(client.id)) {
        console.log(`Registering new player: ${payload.name}`);
        this.gameService.addPlayer(client.id, payload.name, sessionId);
    }
  }

  // Xử lý khi Client ngắt kết nối
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // Chỉ xóa khỏi map tạm thời, Session vẫn giữ trong Service
    this.gameService.removePlayer(client.id);
  }

  // Lắng nghe input di chuyển từ Client
  // Dữ liệu client gửi lên: socket.emit('playerInput', { direction: 'right' });
 @SubscribeMessage('tankInput')
  handleMove(
    @MessageBody() tankInput: TankInput,
    @ConnectedSocket() client: Socket,
  ): void {
    // Chỉ xử lý nếu xe tăng thực sự tồn tại
    if (this.gameService.getTank(client.id)) {
        this.gameService.handleTankInput(client.id, tankInput);
    }
  }

  @SubscribeMessage('bulletInput')
  handleBulletFire(
    @MessageBody() bulletInput: BulletInput, 
    @ConnectedSocket() client: Socket
  ): void {
     // Chỉ cho bắn nếu xe tồn tại và còn sống
     const tank = this.gameService.getTank(client.id);
     if (tank && tank.health > 0) {
        this.gameService.handleBulletFire(client.id, bulletInput);
     }
  }
}