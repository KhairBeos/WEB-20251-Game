// src/game/game.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';

// Import MapData nội bộ (Copy file MapData vào backend/src/Model/MapData.ts trước nhé)
import { INITIAL_MAP, MAP_ROWS, MAP_COLS } from '../Model/MapData';
import { borderCollision } from './collision/BorderCollision';
import { tankCollision } from './collision/TankCollision';
import { GridSpatial } from './utils/GridSpartial';
import { bulletVSTankCollision } from './collision/BulletVSTankCollision';
import { now } from 'mongoose';
import { BulletState, BulletInputBuffer, BulletInput } from './model/Bullet';
import { TankState, TankInput, TankInputBuffer } from './model/Tank';

const SHOOT_COOLDOWN = 1000;
const TILE_SIZE = 40; // Đơn vị cơ sở

@Injectable()
export class GameService implements OnModuleInit {
  private currentMap: number[][] = [];

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

    // Tìm spawn point
    const spawnPoints: { r: number; c: number }[] = [];
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        if (this.currentMap[r][c] === 9) spawnPoints.push({ r, c });
      }
    }
    const spawn =
      spawnPoints.length > 0
        ? spawnPoints[Math.floor(Math.random() * spawnPoints.length)]
        : { r: 1, c: 1 };

    this.tankState.tankStates[id] = {
      id: id,
      x: spawn.c * TILE_SIZE + TILE_SIZE / 2,
      y: spawn.r * TILE_SIZE + TILE_SIZE / 2,
      degree: Math.floor(Math.random() * 360),
      health: 100,
      maxHealth: 100,
      width: 66,
      height: 86,
      radius: 86 / 2,
      lastShootTimestamp: 0,
    };
    this.bulletState.bulletStates[id] = {};
    console.log(`Player ${id} joined.`);

    // Gửi Map ngay cho người mới
    if (this.server) {
      setTimeout(() => {
        this.server.to(id).emit('mapData', { map: this.currentMap });
      }, 100);
    }
  }

  removePlayer(id: string) {
    delete this.tankInputBuffer[id];
    delete this.tankState.tankStates[id];
  }

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
    this.updateGameLogic();
    this.updateBulletLogic();

    // Cập nhật lưới không gian
    this.gridSpatial.updateGrid(
      Object.values(this.tankState.tankStates),
      Object.values(this.bulletState.bulletStates).flatMap((bullets) => Object.values(bullets)),
    );

    // Kiếm tra va chạm đạn và tank
    var collisions = bulletVSTankCollision(
      Object.values(this.tankState.tankStates),
      Object.values(this.bulletState.bulletStates).flatMap((bullets) => Object.values(bullets)),
      this.gridSpatial,
    );

    // Xử lý va chạm
    collisions.forEach((collision) => {
      const bulletOwnerId = collision.bulletId.split('_')[1];
      if (!this.bulletState.bulletStates[bulletOwnerId]) return;
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
      this.tankState.serverTimestamp = Date.now();
      this.bulletState.serverTimestamp = Date.now();
      this.server.emit('tankState', this.tankState);
      this.server.emit('bulletState', this.bulletState);
    }
  }

  // --- HELPER: Tìm ô gốc (Root) của vật thể to ---
  private findRoot(r: number, c: number): { r: number; c: number; val: number } | null {
    // Quét ngược lên trên và trái để tìm ô gốc (Tower 2x2, Tree 3x3)
    for (let i = 0; i <= 2; i++) {
      for (let j = 0; j <= 2; j++) {
        if (i === 0 && j === 0) continue;
        const nr = r - i;
        const nc = c - j;
        if (nr >= 0 && nc >= 0 && nr < MAP_ROWS && nc < MAP_COLS) {
          const val = this.currentMap[nr][nc];
          // Tower (1-4) bán kính tìm 1 ô
          if (val >= 1 && val <= 4 && i < 2 && j < 2) return { r: nr, c: nc, val };
          // Tree (10) bán kính tìm 2 ô
          if (val === 10 && i < 3 && j < 3) return { r: nr, c: nc, val };
        }
      }
    }
    return null;
  }

  // --- HELPER: Check va chạm HÌNH TRÒN (Cho Cây) ---
  private checkCircleHit(
    objX: number,
    objY: number,
    objRadius: number,
    treeRootR: number,
    treeRootC: number,
  ): boolean {
    // Tâm cây nằm giữa vùng 3x3 (1.5 ô từ gốc)
    const treeCenterX = treeRootC * TILE_SIZE + 1.5 * TILE_SIZE;
    const treeCenterY = treeRootR * TILE_SIZE + 1.5 * TILE_SIZE;
    const treeRadius = 50; // Bán kính cây (nhỏ hơn 60 để dễ đi)

    const dx = objX - treeCenterX;
    const dy = objY - treeCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < treeRadius + objRadius;
  }

  // --- CHECK VA CHẠM TỔNG HỢP ---
  private checkCollision(x: number, y: number, width: number, height: number): boolean {
    const padding = 2; // Giảm padding để hitbox chính xác hơn
    const left = Math.floor((x - width / 2 + padding) / TILE_SIZE);
    const right = Math.floor((x + width / 2 - padding) / TILE_SIZE);
    const top = Math.floor((y - height / 2 + padding) / TILE_SIZE);
    const bottom = Math.floor((y + height / 2 - padding) / TILE_SIZE);

    const objRadius = width / 2; // Giả sử vật thể là tròn khi check với cây

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) return true;

        const tile = this.currentMap[r][c];

        // 0 (Đất) và 9 (Spawn) đi qua
        if (tile === 0 || tile === 9) continue;

        // Xử lý vật thể to (99) hoặc gốc (10)
        let root = { r, c, val: tile };
        if (tile === 99) {
          const found = this.findRoot(r, c);
          if (found) root = found;
        }

        // 1. Va chạm CÂY (Hình tròn)
        if (root.val === 10) {
          if (this.checkCircleHit(x, y, objRadius, root.r, root.c)) return true;
        }
        // 2. Va chạm TƯỜNG (Hình vuông) - Chặn cứng
        else if (root.val >= 1 && root.val <= 4) {
          return true;
        }
      }
    }
    return false;
  }

  private updateBulletLogic() {
    for (const pid in this.bulletInputBuffer) {
      const bullets = this.bulletState.bulletStates[pid];
      if (!bullets) continue;
      let inputs = this.bulletInputBuffer[pid];
      const now = Date.now();
      inputs = inputs.filter((i) => now - i.clientTimestamp <= this.MAX_INPUT_LAG_MS);

      // Tạo đạn
      for (const i of inputs) {
        const bid = `b_${pid}_${i.clientTimestamp}_${Math.random()}`;
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

        // --- XỬ LÝ BẮN TRÚNG MAP ---
        const c = Math.floor(b.x / TILE_SIZE);
        const r = Math.floor(b.y / TILE_SIZE);

        if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) {
          delete bullets[bid];
          continue;
        }

        let tile = this.currentMap[r][c];
        let root = { r, c, val: tile };

        // // Tìm gốc nếu trúng thân
        // if (tile === 99) {
        //   const found = this.findRoot(r, c);
        //   if (found) {
        //     root = found;
        //     tile = found.val;
        //   }
        // }

        // // 1. Bắn trúng Tường (1-4) -> Phá hủy
        // if (tile >= 1 && tile <= 4) {
        //   this.currentMap[root.r][root.c] -= 1; // Trừ máu
        //   const newVal = this.currentMap[root.r][root.c];

        //   if (newVal === 0) {
        //     // Phá hủy hoàn toàn: Xóa cả 4 ô (2x2)
        //     this.currentMap[root.r][root.c] = 0;
        //     this.currentMap[root.r + 1][root.c] = 0;
        //     this.currentMap[root.r][root.c + 1] = 0;
        //     this.currentMap[root.r + 1][root.c + 1] = 0;

        //     // Update map cho client (gửi cả 4 ô)
        //     this.server.emit('mapUpdate', { r: root.r, c: root.c, val: 0 });
        //     this.server.emit('mapUpdate', { r: root.r + 1, c: root.c, val: 0 });
        //     this.server.emit('mapUpdate', { r: root.r, c: root.c + 1, val: 0 });
        //     this.server.emit('mapUpdate', { r: root.r + 1, c: root.c + 1, val: 0 });
        //   } else {
        //     // Chỉ nứt tường
        //     this.server.emit('mapUpdate', { r: root.r, c: root.c, val: newVal });
        //   }
        //   delete bullets[bid];
        //   continue;
        // }
        // // 2. Bắn trúng Cây (10)
        // else if (tile === 10) {
        //   if (this.checkCircleHit(b.x, b.y, 5, root.r, root.c)) {
        //     delete bullets[bid];
        //     continue;
        //   }
        // }

        // Check va chạm tank khác (giữ nguyên logic cũ của bạn nếu có)...

        //     // Duyet qua tất cả input để tạo đạn
        //   for (const input of bulletInputs) {
        //     // Tạo id đạn duy nhất
        //     const bulletId = `bullet_${playerId}_${now}`;

        //     // Tạo đạn mới ở vị trí và góc hiện tại của tank
        //     const newBullet: Bullet = {
        //       id: bulletId,
        //       x: input.startX,
        //       y: input.startY,
        //       width: input.width,
        //       height: input.height,
        //       degree: input.degree,
        //       speed: input.speed,
        //       damage: input.damage,
        //       ownerId: playerId,
        //     };
        //     bullets[bulletId] = newBullet;
        //   }
        // }

        // // Xóa các input đã xử lý khỏi buffer
        // for (const playerId in this.bulletInputBuffer) {
        //   this.bulletInputBuffer[playerId] = [];
        // }

        // // Cập nhật vị trí đạn
        // for (const playerId in this.bulletInputBuffer) {
        //   const bullets = this.bulletState.bulletStates[playerId];
        //   if (!bullets) continue;

        //   // Cập nhật vị trí đạn
        //   for (const bulletId in bullets) {
        //     const bullet = bullets[bulletId];
        //     const angleInRadians = bullet.degree * (Math.PI / 180);
        //     bullet.x += bullet.speed * Math.sin(angleInRadians);
        //     bullet.y += -bullet.speed * Math.cos(angleInRadians);
        //   }

        //   // Xóa đạn nếu ra khỏi khung canvas (giả sử canvas 1200x800)
        //   for (const bulletId in bullets) {
        //     const bullet = bullets[bulletId];
        //     if (bullet.x < 0 || bullet.x > 1200 || bullet.y < 0 || bullet.y > 800) {
        //       delete bullets[bulletId];
        //     }
        //   }
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

        // giới hạn vị trí trong khung canvas (giả sử canvas 1200x800)
        borderCollision(tank, 1200, 800);

        // giới hạn va chạm giữa các tank
        tankCollision(this.tankState.tankStates, tank, deltaX, deltaY);

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
