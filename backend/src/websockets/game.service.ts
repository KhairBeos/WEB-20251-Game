// src/game/game.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';

// Import MapData nội bộ (Copy file MapData vào backend/src/Model/MapData.ts trước nhé)
import { INITIAL_MAP, MAP_ROWS, MAP_COLS } from '../Model/MapData';

const SHOOT_COOLDOWN = 1000;
const TILE_SIZE = 40; // Đơn vị cơ sở

interface Tank {
  x: number;
  y: number;
  degree: number;
  health: number;
  width: number;
  height: number;
  lastShootTimestamp: number;
}
interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  degree: number;
  speed: number;
  damage: number;
}
interface BulletInput {
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
  tankStates: { [playerId: string]: Tank };
}
interface BulletState {
  serverTimestamp: number;
  bulletStates: { [playerId: string]: { [bulletId: string]: Bullet } };
}
interface TankInputBuffer {
  [playerId: string]: TankInput[];
}
interface BulletInputBuffer {
  [playerId: string]: BulletInput[];
}

@Injectable()
export class GameService implements OnModuleInit {
  private currentMap: number[][] = [];
  private tankState: TankState = { serverTimestamp: 0, tankStates: {} };
  private bulletState: BulletState = { serverTimestamp: 0, bulletStates: {} };
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
      x: spawn.c * TILE_SIZE + TILE_SIZE / 2,
      y: spawn.r * TILE_SIZE + TILE_SIZE / 2,
      degree: Math.floor(Math.random() * 360),
      health: 100,
      width: 40,
      height: 60,
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
    if (this.tankState.tankStates[id]) {
      this.bulletInputBuffer[id].push(bulletInput);
      this.bulletInputBuffer[id].sort((a, b) => a.clientTimestamp - b.clientTimestamp);
    }
  }

  handleTankInput(id: string, input: TankInput) {
    if (this.tankState.tankStates[id]) {
      this.tankInputBuffer[id].push(input);
      this.tankInputBuffer[id].sort((a, b) => a.clientTimestamp - b.clientTimestamp);
    }
  }

  private gameLoop() {
    this.updateGameLogic();
    this.updateBulletLogic();
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

        // Tìm gốc nếu trúng thân
        if (tile === 99) {
          const found = this.findRoot(r, c);
          if (found) {
            root = found;
            tile = found.val;
          }
        }

        // 1. Bắn trúng Tường (1-4) -> Phá hủy
        if (tile >= 1 && tile <= 4) {
          this.currentMap[root.r][root.c] -= 1; // Trừ máu
          const newVal = this.currentMap[root.r][root.c];

          if (newVal === 0) {
            // Phá hủy hoàn toàn: Xóa cả 4 ô (2x2)
            this.currentMap[root.r][root.c] = 0;
            this.currentMap[root.r + 1][root.c] = 0;
            this.currentMap[root.r][root.c + 1] = 0;
            this.currentMap[root.r + 1][root.c + 1] = 0;

            // Update map cho client (gửi cả 4 ô)
            this.server.emit('mapUpdate', { r: root.r, c: root.c, val: 0 });
            this.server.emit('mapUpdate', { r: root.r + 1, c: root.c, val: 0 });
            this.server.emit('mapUpdate', { r: root.r, c: root.c + 1, val: 0 });
            this.server.emit('mapUpdate', { r: root.r + 1, c: root.c + 1, val: 0 });
          } else {
            // Chỉ nứt tường
            this.server.emit('mapUpdate', { r: root.r, c: root.c, val: newVal });
          }
          delete bullets[bid];
          continue;
        }
        // 2. Bắn trúng Cây (10)
        else if (tile === 10) {
          if (this.checkCircleHit(b.x, b.y, 5, root.r, root.c)) {
            delete bullets[bid];
            continue;
          }
        }

        // Check va chạm tank khác (giữ nguyên logic cũ của bạn nếu có)...
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

      let { x, y, degree } = tank;

      for (const i of inputs) {
        if (i.rotate === 'left') degree -= this.TANK_ROTATE_SPEED;
        if (i.rotate === 'right') degree += this.TANK_ROTATE_SPEED;
        degree = (degree + 360) % 360;
        const rad = (degree * Math.PI) / 180;

        let dx = 0,
          dy = 0;
        if (i.direction === 'forward') {
          dx = SPEED * Math.sin(rad);
          dy = -SPEED * Math.cos(rad);
        }
        if (i.direction === 'backward') {
          dx = -SPEED * Math.sin(rad);
          dy = SPEED * Math.cos(rad);
        }

        // Check va chạm (Sliding)
        if (!this.checkCollision(x + dx, y, tank.width, tank.height)) x += dx;
        if (!this.checkCollision(x, y + dy, tank.width, tank.height)) y += dy;

        if (i.isFire && Date.now() - tank.lastShootTimestamp >= SHOOT_COOLDOWN) {
          tank.lastShootTimestamp = Date.now();
          this.handleBulletFire(pid, {
            clientTimestamp: Date.now(),
            startX: x + (tank.width / 2) * Math.sin(rad),
            startY: y + (tank.height / 2) * -Math.cos(rad),
            width: 20,
            height: 20,
            degree,
            speed: 12,
            damage: 1,
          });
        }
      }
      tank.x = x;
      tank.y = y;
      tank.degree = degree;
    }
    for (const pid in this.tankInputBuffer) this.tankInputBuffer[pid] = [];
  }
}
