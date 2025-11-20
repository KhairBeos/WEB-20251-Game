// src/game/game.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { borderCollision } from './collision/BorderCollision';
import { tankCollision } from './collision/TankCollision';
import { GridSpatial } from './utils/GridSpartial';
import { bulletVSTankCollision } from './collision/BulletVSTankCollision';

const SHOOT_COOLDOWN = 1000; // 1000 ms giữa các lần bắn
export interface Tank {
  id:string;
  x: number;
  y: number;
  degree: number;
  health: number;
  width: number;
  height: number;
  maxHealth: number;
  radius: number;
  lastShootTimestamp: number;
}
export interface Bullet {
  id:string;
  x: number;
  y: number;
  width: number;
  height: number;
  degree: number;
  speed: number;
  damage: number;
  ownerId: string;
}

interface BulletInput {
  // Define bullet input properties if needed
  clientTimestamp: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
  degree: number;
  speed: number;
  damage: number;
}

export interface TankInput {
  clientTimestamp: number;
  rotate: 'left' | 'right' | 'none';
  direction: 'forward' | 'backward' | 'none';
  isFire: boolean;
}

interface TankState {
  serverTimestamp: number;
  tankStates: {
    [playerId: string]: Tank;
  };
}
interface BulletState {
  serverTimestamp: number;
  bulletStates: {
    [playerId: string]: {
      // Key là bulletId (ID duy nhất của viên đạn)
      [bulletId: string]: Bullet;
    };
  };
}

interface TankInputBuffer {
  [playerId: string]: TankInput[];
}

interface BulletInputBuffer {
  [playerId: string]: BulletInput[];
}

@Injectable()
export class GameService implements OnModuleInit {
  private readonly logger = new Logger(GameService.name);
  
  private tankState: TankState = {
    serverTimestamp: 0,
    tankStates: {},
  };

  private bulletState: BulletState = {
    serverTimestamp: 0,
    bulletStates: {},
  };


  private gridSpatial: GridSpatial = new GridSpatial();

  constructor() {}
  

  //private gameInputState: GameInputState = {};
  private tankInputBuffer: TankInputBuffer = {};
  private bulletInputBuffer: BulletInputBuffer = {};

  private server: Server;
  private readonly GAME_TICK_RATE = 100 / 60; // 60 FPS
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
    // Khởi tạo trạng thái input
    this.tankInputBuffer[id] = [];
    this.bulletInputBuffer[id] = [];

    // Khởi tạo trạng thái tank
    this.tankState.tankStates[id] = {
      id:id,
      x: 0,
      y: 0,
      degree: Math.floor(Math.random() * 360),
      health: 100,
      maxHealth: 100,
      width: 66,
      height: 86,
      radius: 86/2,
      lastShootTimestamp: 0,
    };

    // Khởi tạo trạng thái đạn
    this.bulletState.bulletStates[id] = {};

    console.log(
      `Player ${id} joined. Total: ${Object.keys(this.tankState.tankStates).length}`,
    );
  }

  // Xóa người chơi
  removePlayer(id: string) {
    delete this.tankInputBuffer[id];
    delete this.tankState.tankStates[id];
    console.log(
      `Player ${id} left. Total: ${Object.keys(this.tankState.tankStates).length}`,
    );
  }

  // Xử lý input bắn từ người chơi
  handleBulletFire(id: string, bulletInput: BulletInput) {
    // kiểm tra người chơi tồn tại
    const player = this.tankState.tankStates[id];
    const bullet = this.bulletState.bulletStates[id];
    if (!player) return;

    // // Kiểm tra thời gian bắn
    // const now = Date.now();
    // const timeSinceLastShot = now - player.lastShootTimestamp;
    // const SHOOT_COOLDOWN = 1000;
    // if (timeSinceLastShot < SHOOT_COOLDOWN) return; // Chưa đủ thời gian để bắn
    // player.lastShootTimestamp = now;

    // 1. Lưu Input bắn vào Buffer
    this.bulletInputBuffer[id].push(bulletInput);

    // 2. Sắp xếp Buffer dựa trên clientTimestamp để xử lý lệch thứ tự
    this.bulletInputBuffer[id].sort(
      (a, b) => a.clientTimestamp - b.clientTimestamp,
    );
  }

  // Xử lý input từ người chơi
  handleTankInput(id: string, input: TankInput) {
    const player = this.tankState.tankStates[id];
    if (!player) return;

    // 1. Lưu Input vào Buffer
    this.tankInputBuffer[id].push(input);

    // 2. Sắp xếp Buffer dựa trên clientTimestamp để xử lý lệch thứ tự
    this.tankInputBuffer[id].sort(
      (a, b) => a.clientTimestamp - b.clientTimestamp,
    );
  }

  // Vòng lặp game - Cập nhật trạng thái và gửi đi
  private gameLoop() {
    
    // 1. Cập nhật logic game dựa trên input
    this.updateGameLogic();
    this.updateBulletLogic();
    this.gridSpatial.updateGrid(
      Object.values(this.tankState.tankStates),
      Object.values(this.bulletState.bulletStates).flatMap(bullets => Object.values(bullets)),
    );  
    var collisions = bulletVSTankCollision(
      Object.values(this.tankState.tankStates),
      Object.values(this.bulletState.bulletStates).flatMap(bullets => Object.values(bullets)),
      this.gridSpatial,
    );
    // Xử lý va chạm
    collisions.forEach(collision => {
      const bulletOwnerId = collision.bulletId.split('_')[1];
      if(!this.bulletState.bulletStates[bulletOwnerId]) return;
      const bullet = this.bulletState.bulletStates[bulletOwnerId][collision.bulletId];
      const tank = this.tankState.tankStates[collision.tankId];
      if (bullet && tank) {
        // Giảm máu tank
        tank.health -= bullet.damage;
        console.log(`Tank ${tank.id} hit by bullet ${bullet.id}. Health: ${tank.health}`);
        // Xóa đạn sau khi va chạm
        delete this.bulletState.bulletStates[bulletOwnerId][collision.bulletId];
        // Kiểm tra tank bị hạ gục
        if (tank.health <= 0) {
          console.log(`Tank ${tank.id} destroyed!`);
          // Xử lý tank bị hạ gục (ví dụ: đặt lại vị trí, hồi máu, v.v.)
          tank.health = tank.maxHealth;
          tank.x = 0;
          tank.y = 0;
        }
      }
    });

    this.tankState.serverTimestamp = Date.now();
    this.bulletState.serverTimestamp = Date.now();


    // 2. Gửi trạng thái game MỚI đến tất cả client
    if (this.server) {
      this.server.emit('tankState', this.tankState);
      this.server.emit('bulletState', this.bulletState);
    }
  }

  private updateBulletLogic() {
    // Tạo đạn mới từ input trong buffer
    for (const playerId in this.bulletInputBuffer) {
      const bullets = this.bulletState.bulletStates[playerId];
      if (!bullets) continue;

      let bulletInputs = this.bulletInputBuffer[playerId];

      // Xử lý tất cả input trong buffer
      // Loại bỏ các input quá cũ
      const now = Date.now();
      bulletInputs = bulletInputs.filter((input) => {
        return now - input.clientTimestamp <= this.MAX_INPUT_LAG_MS;
      });

      // Duyet qua tất cả input để tạo đạn
      for (const input of bulletInputs) {
        // Tạo id đạn duy nhất
        const bulletId = `bullet_${playerId}_${now}`;

        // Tạo đạn mới ở vị trí và góc hiện tại của tank
        const newBullet: Bullet = {
          id: bulletId,
          x: input.startX,
          y: input.startY,
          width: input.width,
          height: input.height,
          degree: input.degree,
          speed: input.speed,
          damage: input.damage,
          ownerId: playerId,
        };
        bullets[bulletId] = newBullet;
      }
    }

    // Xóa các input đã xử lý khỏi buffer
    for (const playerId in this.bulletInputBuffer) {
      this.bulletInputBuffer[playerId] = [];
    }

    // Cập nhật vị trí đạn
    for (const playerId in this.bulletInputBuffer) {
      const bullets = this.bulletState.bulletStates[playerId];
      if (!bullets) continue;

      // Cập nhật vị trí đạn
      for (const bulletId in bullets) {
        const bullet = bullets[bulletId];
        const angleInRadians = bullet.degree * (Math.PI / 180);
        bullet.x += bullet.speed * Math.sin(angleInRadians);
        bullet.y += -bullet.speed * Math.cos(angleInRadians);
      }

      // Xóa đạn nếu ra khỏi khung canvas (giả sử canvas 1200x800)
      for (const bulletId in bullets) {
        const bullet = bullets[bulletId];
        if (bullet.x < 0 || bullet.x > 1200 || bullet.y < 0 || bullet.y > 800) {
          delete bullets[bulletId];
        }
      }
    }
  }

  private updateGameLogic() {
    const SPEED = 4;
    for (const playerId in this.tankInputBuffer) {
      var tankInputs = this.tankInputBuffer[playerId];
      const tank = this.tankState.tankStates[playerId];
      if (!tank) continue;

      // Xử lý tất cả input trong buffer
      // Loại bỏ các input quá cũ
      const now = Date.now();
      tankInputs = tankInputs.filter((input) => {
        return now - input.clientTimestamp <= this.MAX_INPUT_LAG_MS;
      });

      // Cập nhật trạng thái dựa trên input
      let deltaDegree = 0;
      let newDegree = tank.degree;

      for (const input of tankInputs) {
        // Xử lý quay xe tăng
        switch (input.rotate) {
          case 'left':
            deltaDegree = -this.TANK_ROTATE_SPEED;
            break;
          case 'right':
            deltaDegree = this.TANK_ROTATE_SPEED;
            break;
        }
       
        // Cập nhật góc quay mới
        newDegree = (newDegree + deltaDegree + 360) % 360;

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

        tank.x += deltaX;
        tank.y += deltaY;
        tank.degree = newDegree;

        // giới hạn vị trí trong khung canvas (giả sử canvas 1200x800)
        borderCollision(tank, 1200, 800);

        // giới hạn va chạm giữa các tank
        tankCollision(this.tankState.tankStates, tank, deltaX, deltaY);

        // Xử lý bắn
        if (input.isFire) {
          console.log('Firing detected in input buffer');
          // Xử lý bắn
          const timeSinceLastShot = now - tank.lastShootTimestamp;
          if (timeSinceLastShot >= SHOOT_COOLDOWN) {
            tank.lastShootTimestamp = now;
            // Tạo đạn mới ở vị trí và góc hiện tại của tank
            console.log(`Player ${playerId} fired a shot at ${now}`);

            this.handleBulletFire(playerId, {
              clientTimestamp: now,
              startX: tank.x + (tank.width / 2) * Math.sin(angleInRadians),
              startY: tank.y + (tank.height / 2) * -Math.cos(angleInRadians),
              width: 32,
              height: 36,
              degree: tank.degree,
              speed: 2,
              damage: 10,
            });
          }
        }
      }
    }
    // Xóa các input đã xử lý khỏi buffer
    for (const playerId in this.tankInputBuffer) {
      this.tankInputBuffer[playerId] = [];
    }
    // Xử lý tanks va chạm
  }
}
