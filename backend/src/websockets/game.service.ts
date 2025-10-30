// src/game/game.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';

interface PlayerState {
  x: number;
  y: number;
  direction: string;
}

interface GameState {
  [playerId: string]: PlayerState;
}

@Injectable()
export class GameService implements OnModuleInit {
  private gameState: GameState = {};
  private server: Server;
  private readonly GAME_TICK_RATE = 1000 / 30; // 30 FPS

  // Khởi tạo server instance từ Gateway (sẽ được inject sau)
  setServer(server: Server) {
    this.server = server;
  }

  onModuleInit() {
    // Bắt đầu vòng lặp game khi module được khởi tạo
    setInterval(() => this.gameLoop(), this.GAME_TICK_RATE);
  }

  // Thêm người chơi mới
  addPlayer(id: string) {
    this.gameState[id] = { x: 0, y: 0, direction: 'none' };
    console.log(`Player ${id} joined. Total: ${Object.keys(this.gameState).length}`);
  }

  // Xóa người chơi
  removePlayer(id: string) {
    delete this.gameState[id];
    console.log(`Player ${id} left. Total: ${Object.keys(this.gameState).length}`);
  }

  // Xử lý input từ người chơi
  handlePlayerInput(id: string, direction: string) {
    if (this.gameState[id]) {
      this.gameState[id].direction = direction;
    }
  }

  // Vòng lặp game - Cập nhật trạng thái và gửi đi
  private gameLoop() {
    // 1. Cập nhật logic game dựa trên input
    this.updateGameLogic(); 

    // 2. Gửi trạng thái game MỚI đến tất cả client
    if (this.server) {
      this.server.emit('gameState', this.gameState);
    }
  }

  private updateGameLogic() {
    const SPEED = 5;
    for (const id in this.gameState) {
      const player = this.gameState[id];
      switch (player.direction) {
        case 'up': player.y -= SPEED; break;
        case 'down': player.y += SPEED; break;
        case 'left': player.x -= SPEED; break;
        case 'right': player.x += SPEED; break;
      }
      // Đặt lại hướng sau khi xử lý (hoặc dùng input buffer phức tạp hơn)
      player.direction = 'none'; 
    }
  }
}