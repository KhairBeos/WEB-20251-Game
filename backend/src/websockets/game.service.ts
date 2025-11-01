// src/game/game.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
    import { Logger } from '@nestjs/common';
interface TankState {
  serverTimestamp: number;
  x: number;
  y: number;
  degree: number;
  health: number;
  width: number;
  height: number;
  isMoving: boolean;
  isFiring: boolean;
  inputBuffer: TankInput[];
}

export interface TankInput {
  rotate: 'left' | 'right' | 'none';
  direction: 'forward' | 'backward' | 'none';
  clientTimestamp: number;
}

interface GameState {
  [playerId: string]: TankState;
}

interface GameInputState {
  [playerId: string]: TankInput;
}

@Injectable()
export class GameService implements OnModuleInit {
  private gameState: GameState = {};
  private gameInputState: GameInputState = {};
  private server: Server;
  private readonly GAME_TICK_RATE = 100/60; // 30 FPS
  private readonly TANK_ROTATE_SPEED = 3; // degrees per tick
  // Thời gian tối đa cho phép các gói tin đến lệch thứ tự
  private readonly MAX_INPUT_LAG_MS = 100;

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
    this.gameInputState[id] = {
      rotate: 'none',
      direction: 'none',
      clientTimestamp: 0,
    };
    this.gameState[id] = {
      serverTimestamp: 0,
      x: 0,
      y: 0,
      degree: Math.floor(Math.random() * 360),
      health: 100,
      width: 40,
      height: 80,
      isFiring: false,
      isMoving: false,
      inputBuffer: [],
    };
    console.log(
      `Player ${id} joined. Total: ${Object.keys(this.gameState).length}`,
    );
  }

  // Xóa người chơi
  removePlayer(id: string) {
    delete this.gameInputState[id];
    delete this.gameState[id];
    console.log(
      `Player ${id} left. Total: ${Object.keys(this.gameState).length}`,
    );
  }

  // Xử lý input từ người chơi
  handleTankInput(id: string, input: TankInput) {
    
    const player = this.gameState[id];
    if (!player) return;

    // 1. Lưu Input vào Buffer
    player.inputBuffer.push(input);

    // 2. Sắp xếp Buffer dựa trên clientTimestamp để xử lý lệch thứ tự
    player.inputBuffer.sort((a, b) => a.clientTimestamp - b.clientTimestamp);
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
    const SPEED = 4;
    for (const id in this.gameInputState) {
      const player = this.gameState[id];
      var playerInput = player.inputBuffer;
      const now = Date.now();

      // Xử lý tất cả input trong buffer
      // Loại bỏ các input quá cũ
      playerInput = playerInput.filter((input) => {
        return now - input.clientTimestamp <= this.MAX_INPUT_LAG_MS;
      });

      // Cập nhật trạng thái dựa trên input
      let newDegree = player.degree;
      let newX = player.x;
      let newY = player.y;
      let isMoving = false;

      console.log("input size:",playerInput.length)
      for (const input of playerInput) {
       
        // Xử lý quay xe tăng
        switch (input.rotate) {
          case 'left':
            newDegree -= this.TANK_ROTATE_SPEED;
            break;
          case 'right':
            newDegree += this.TANK_ROTATE_SPEED;
            break;
        }
        newDegree = (newDegree + 360) % 360; // Giữ trong 0-359

        // Tính toán góc quay hiện tại
        const angleInRadians = newDegree * (Math.PI / 180);

        // Khởi tạo thay đổi X và Y
        let deltaX = 0;
        let deltaY = 0;

        // Xử lý di chuyển xe tăng
        switch (input.direction) {
          case 'forward':
            deltaX = SPEED * Math.sin(angleInRadians);
            deltaY = -SPEED * Math.cos(angleInRadians);
            break;
          case 'backward':
            deltaX = -SPEED * Math.sin(angleInRadians);
            deltaY = SPEED * Math.cos(angleInRadians);
            break;
        }

        newX += deltaX;
        newY += deltaY;

        // Cập nhật trạng thái mới
        if (input.direction !== 'none') {
          isMoving = true;
        } else {
          isMoving = false;
        }
      }

      // Áp dụng cập nhật cuối cùng sau khi xử lý tất cả input
      player.isMoving = isMoving;
      player.x = newX;
      player.y = newY;
      player.degree = newDegree;
      player.serverTimestamp = Date.now();
      player.inputBuffer = []; // Xóa buffer sau khi xử lý

      // giới hạn vị trí trong khung canvas (giả sử canvas 800x600)
      if (player.x < player.width / 2) {
        player.x = player.width / 2;
      }
      if (player.x > 1200 - player.width / 2) {
        player.x = 1200 - player.width / 2;
      }
      if (player.y < player.height / 2) {
        player.y = player.height / 2;
      }
      if (player.y > 800 - player.height / 2) {
        player.y = 800 - player.height / 2;
      }
    }
  }
}
