// src/game/game.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';

// Import MapData nội bộ (Copy file MapData vào backend/src/Model/MapData.ts trước nhé)
import { INITIAL_MAP, MapCell, SPAWNPOINTS, TILE_SIZE } from '../Model/MapData';
import { bulletVSTankCollision } from './collision/BulletVSTankCollision';
import { tankCollision } from './collision/TankCollision';
import { tankWallCollision } from './collision/TankWallCollision';
import { BulletInput, BulletInputBuffer, BulletState } from './model/Bullet';
import { TankInput, TankInputBuffer, TankState } from './model/Tank';
import { GridSpatial } from './utils/GridSpartial';
import { bulletWallCollision } from './collision/BulletWallCollision';

const SHOOT_COOLDOWN = 1000;

@Injectable()
export class GameService implements OnModuleInit {
  private currentMap: MapCell[][] = [];

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
  private readonly GAME_TICK_RATE = 1000 / 60;
  private readonly TANK_ROTATE_SPEED = 3;
  private readonly MAX_INPUT_LAG_MS = 100;

  setServer(server: Server) {
    this.server = server;
  }

  onModuleInit() {
    // Deep copy map gốc
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.currentMap = JSON.parse(JSON.stringify(INITIAL_MAP));
    setInterval(() => this.gameLoop(), this.GAME_TICK_RATE);
  }

  addPlayer(id: string) {
    // Khởi tạo trạng thái input
    this.tankInputBuffer[id] = [];
    this.bulletInputBuffer[id] = [];

    
    const spawn =
      SPAWNPOINTS.length > 0
        ? SPAWNPOINTS[Math.floor(Math.random() * SPAWNPOINTS.length)]
        : { r: 6, c: 6 };

    this.logger.log(`Spawning player ${id} at (${spawn.r}, ${spawn.c})`);

    this.tankState.tankStates[id] = {
      id: id,
       x: spawn.c * TILE_SIZE + TILE_SIZE / 2,
       y: spawn.r * TILE_SIZE + TILE_SIZE / 2,
      // x: 5 * TILE_SIZE,
      // y: 5 * TILE_SIZE,
      degree: Math.floor(Math.random() * 360),
      health: 100,
      maxHealth: 100,
      width: 66,
      height: 86,
      radius: 86 / 2,
      lastShootTimestamp: 0,
    };

    console.log(`Player ${id} joined.`);
    console.log(`Initial Tank State:`, this.tankState.tankStates[id]);

    // Gửi Map ngay cho người mới
    if (this.server) {
      setTimeout(() => {
        this.server.to(id).emit('mapData', { map: this.currentMap });
      }, 100);
    }
  }

  removePlayer(id: string) {
    // Xóa trạng thái và buffer của người chơi
    console.log(`Player ${id} left.`);
    delete this.bulletInputBuffer[id];
    delete this.tankInputBuffer[id];
    delete this.tankState.tankStates[id];
  }

  
  handleBulletFire(id: string, bulletInput: BulletInput) {
    // kiểm tra người chơi tồn tại
    const player = this.tankState.tankStates[id];
    //const bulletId = `b_${Date.now()}_${Math.random()}`;
    if (!player) return;

    // 1. Lưu Input bắn vào Buffer
    this.bulletInputBuffer[id].push(bulletInput);

    // 2. Sắp xếp Buffer dựa trên clientTimestamp để xử lý lệch thứ tự
    this.bulletInputBuffer[id].sort((a, b) => a.clientTimestamp - b.clientTimestamp);
  }

  handleTankInput(id: string, input: TankInput) {
    const player = this.tankState.tankStates[id];
    if (!player) return;

    // 1. Lưu Input vào Buffer
    this.tankInputBuffer[id].push(input);

    // 2. Sắp xếp Buffer dựa trên clientTimestamp để xử lý lệch thứ tự
    this.tankInputBuffer[id].sort((a, b) => a.clientTimestamp - b.clientTimestamp);
  }

  // Vòng lặp game - Cập nhật trạng thái và gửi đi
  private gameLoop() {
    // 1. Cập nhật logic game dựa trên input
    
    // // Cập nhật lưới không gian
    // this.gridSpatial.updateGrid(
      //   Object.values(this.tankState.tankStates),
      //   Object.values(this.bulletState.bulletStates).flatMap((bullets) => Object.values(bullets)),
      // );
      
      // // Kiếm tra va chạm đạn và tank
    // var collisions = bulletVSTankCollision(
      //   Object.values(this.tankState.tankStates),
      //   Object.values(this.bulletState.bulletStates).flatMap((bullets) => Object.values(bullets)),
      //   this.gridSpatial,
      // );
      
      // // Xử lý va chạm
      // collisions.forEach((collision) => {
        //   const bulletOwnerId = collision.bulletId.split('_')[1];
    //   if (!this.bulletState.bulletStates[bulletOwnerId]) return;
    //   const bullet = this.bulletState.bulletStates[bulletOwnerId][collision.bulletId];
    //   const tank = this.tankState.tankStates[collision.tankId];
    //   if (bullet && tank) {
    //     // Giảm máu tank
    //     tank.health -= bullet.damage;
    //     console.log(`Tank ${tank.id} hit by bullet ${bullet.id}. Health: ${tank.health}`);
    //     // Xóa đạn sau khi va chạm
    //     delete this.bulletState.bulletStates[bulletOwnerId][collision.bulletId];
    //     // Kiểm tra tank bị hạ gục
    //     if (tank.health <= 0) {
      //       console.log(`Tank ${tank.id} destroyed!`);
    //       // Xử lý tank bị hạ gục (ví dụ: đặt lại vị trí, hồi máu, v.v.)
    //       tank.health = tank.maxHealth;
    //       tank.x = 0;
    //       tank.y = 0;
    //     }
    //   }
    // });
    
    
    // 2. Gửi trạng thái game MỚI đến tất cả client
    if (this.server) {
      this.updateGameLogic();
      this.updateBulletLogic();

      this.gridSpatial.updateGrid(
        Object.values(this.tankState.tankStates),
        Object.values(this.bulletState.bulletStates).flatMap((bullets) => Object.values(bullets)),
      );

      tankCollision(this.tankState.tankStates, this.gridSpatial);
      tankWallCollision(this.currentMap, this.tankState.tankStates);
      bulletWallCollision(this.currentMap,this.bulletState.bulletStates, this.server);
      bulletVSTankCollision(this.tankState.tankStates, this.bulletState.bulletStates, this.gridSpatial);
      
      this.tankState.serverTimestamp = Date.now();
      this.bulletState.serverTimestamp = Date.now();

      // console.log('Emitting tank and bullet states to clients');
      // console.log('Tank State:', this.tankState);
      this.server.emit('tankState', this.tankState);
      this.server.emit('bulletState', this.bulletState);
    }
  }


  // // --- CHECK VA CHẠM TỔNG HỢP ---
  // private checkCollision(x: number, y: number, width: number, height: number): boolean {
  //   const padding = 2; // Giảm padding để hitbox chính xác hơn
  //   const left = Math.floor((x - width / 2 + padding) / TILE_SIZE);
  //   const right = Math.floor((x + width / 2 - padding) / TILE_SIZE);
  //   const top = Math.floor((y - height / 2 + padding) / TILE_SIZE);
  //   const bottom = Math.floor((y + height / 2 - padding) / TILE_SIZE);

  //   const objRadius = width / 2; // Giả sử vật thể là tròn khi check với cây

  //   for (let r = top; r <= bottom; r++) {
  //     for (let c = left; c <= right; c++) {
  //       if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) return true;

  //       const tile = this.currentMap[r][c];

  //       // 0 (Đất) và 9 (Spawn) đi qua
  //       if (tile === 0 || tile === 9) continue;

  //       // Xử lý vật thể to (99) hoặc gốc (10)
  //       let root = { r, c, val: tile };
  //       if (tile === 99) {
  //         const found = this.findRoot(r, c);
  //         if (found) root = found;
  //       }

  //       // 1. Va chạm CÂY (Hình tròn)
  //       if (root.val === 10) {
  //         if (this.checkCircleHit(x, y, objRadius, root.r, root.c)) return true;
  //       }
  //       // 2. Va chạm TƯỜNG (Hình vuông) - Chặn cứng
  //       else if (root.val >= 1 && root.val <= 4) {
  //         return true;
  //       }
  //     }
  //   }
  //   return false;
  // }

  private updateBulletLogic() {
    for (const pid in this.bulletInputBuffer) {
      const bullets = this.bulletState.bulletStates;
      if (!bullets) continue;
      let inputs = this.bulletInputBuffer[pid];
      const now = Date.now();
      inputs = inputs.filter((i) => now - i.clientTimestamp <= this.MAX_INPUT_LAG_MS);

      // Tạo đạn
      for (const i of inputs) {
        const bid = `b_${pid}_${i.clientTimestamp}_${Math.random()}`;
        console.log(`Creating bullet ${bid} for player ${pid}`);
        bullets[bid] = {
          id: bid,
          ownerId: pid,
          x: i.startX,
          y: i.startY,
          width: i.width,
          height: i.height,
          degree: i.degree,
          speed: i.speed,
          damage: i.damage,
        };
      }
      this.bulletInputBuffer[pid] = [];

      // Update đạn
      for (const bid in bullets) {
        const b = bullets[bid];
        b.x += b.speed * Math.sin((b.degree * Math.PI) / 180);
        b.y -= b.speed * Math.cos((b.degree * Math.PI) / 180);
      }
    }
  }

  private updateGameLogic() {
    const SPEED = 4;
   
    for (const pid in this.tankInputBuffer) {
      const tank = this.tankState.tankStates[pid];
      if (!tank) continue;
      let inputs = this.tankInputBuffer[pid];
      inputs = inputs.filter((i) => Date.now() - i.clientTimestamp <= this.MAX_INPUT_LAG_MS);

      // Cập nhật trạng thái dựa trên input
      let deltaDegree = 0;
      let newDegree = tank.degree;

      for (const input of inputs) {
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

        // Xử lý bắn
        const now = Date.now();
        if (input.isFire) {
          console.log('Firing detected in input buffer');
          // Xử lý bắn
          const timeSinceLastShot = now - tank.lastShootTimestamp;
          if (timeSinceLastShot >= SHOOT_COOLDOWN) {
            tank.lastShootTimestamp = now;
            // Tạo đạn mới ở vị trí và góc hiện tại của tank
            console.log(`Player ${pid} fired a shot at ${now}`);

            this.handleBulletFire(pid, {
              clientTimestamp: now,
              startX: tank.x + (tank.width / 2) * Math.sin(angleInRadians),
              startY: tank.y + (tank.height / 2) * -Math.cos(angleInRadians),
              width: 32,
              height: 36,
              degree: tank.degree,
              speed: 10,
              damage: 10,
              ownerId: pid,
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
