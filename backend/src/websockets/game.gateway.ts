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

@WebSocketGateway({
  cors: { origin: '*' },
  // Bạn có thể chỉ định namespace nếu cần, ví dụ: namespace: 'game'
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: gameService.GameService) {}

  onModuleInit() {
    // Cung cấp instance của Socket.io Server cho Game Service
    this.gameService.setServer(this.server);
  }

  // Xử lý khi Client kết nối
  handleConnection(@ConnectedSocket() client: Socket) {
    // Thêm người chơi vào Game Service
    this.gameService.addPlayer(client.id); 
    // Thêm client vào một phòng chung (nếu đây là game 1 phòng)
    // client.join('main_room');
  }

  // Xử lý khi Client ngắt kết nối
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // Xóa người chơi khỏi Game Service
    this.gameService.removePlayer(client.id);
  }

  // Lắng nghe input di chuyển từ Client
  // Dữ liệu client gửi lên: socket.emit('playerInput', { direction: 'right' });
  @SubscribeMessage('tankInput')
  handleMove(@MessageBody() tankInput: gameService.TankInput, @ConnectedSocket() client: Socket): void {
    // Chuyển input đến Game Service để xử lý trong vòng lặp game
    //console.log(`Received input from ${client.id}:`, tankInput);
    console.log("received input")
    this.gameService.handleTankInput(client.id, tankInput);
  }

  


}