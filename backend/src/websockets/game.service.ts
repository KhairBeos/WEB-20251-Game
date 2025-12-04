// src/game/game.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';

import { INITIAL_MAP, TILE_SIZE, MapCell, SPAWNPOINTS } from './model/MapData';
import { BulletState, BulletInputBuffer, BulletInput } from './model/Bullet';
import { TankState, TankInput, TankInputBuffer } from './model/Tank';
import { VisibilityService } from './visibility/VisibilityService';
import { MapService } from './map/MapService';
import { TankStateManager } from './state/TankStateManager';
import { BulletStateManager } from './state/BulletStateManager';

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

  private visibilityService: VisibilityService;
  private mapService: MapService;
  private tankManager: TankStateManager;
  private bulletManager: BulletStateManager;
  private lastBroadcastTs: number | undefined;

  constructor() {}

  //private gameInputState: GameInputState = {};
  private tankInputBuffer: TankInputBuffer = {};
  private bulletInputBuffer: BulletInputBuffer = {};

  private server: Server;
  private readonly GAME_TICK_RATE = 1000 / 60;

  setServer(server: Server) {
    this.server = server;
  }

  onModuleInit() {
    // Deep copy map gốc
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.currentMap = JSON.parse(JSON.stringify(INITIAL_MAP));
    // init services
    this.visibilityService = new VisibilityService(this.currentMap);
    this.mapService = new MapService(this.currentMap);
    this.tankManager = new TankStateManager();
    this.bulletManager = new BulletStateManager();
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
      inBush: false,
    };

    this.bulletState.bulletStates[id] = {};
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
    // Gửi trạng thái game MỚI đến tất cả client
    if (this.server) {
      this.tankManager.update(
        this.tankState,
        this.tankInputBuffer,
        this.currentMap,
        (pid, payload) => this.handleBulletFire(pid, payload),
      );
      this.bulletManager.update(
        this.bulletState,
        this.bulletInputBuffer,
        this.currentMap,
        this.server,
      );

      const nowTs = Date.now();
      this.tankState.serverTimestamp = nowTs;
      this.bulletState.serverTimestamp = nowTs;

      // Phát trạng thái tank và đạn theo người xem (ẩn theo bụi) - 60Hz
      const viewers = Object.keys(this.tankState.tankStates);
      for (const viewerId of viewers) {
        const visibleTanks = this.visibilityService.buildVisibleTankStateFor(
          viewerId,
          nowTs,
          this.tankState,
        );
        const visibleBullets = this.visibilityService.buildVisibleBulletStateFor(
          viewerId,
          nowTs,
          this.bulletState,
          this.tankState,
        );
        // Legacy events
        this.server.to(viewerId).emit('tankState', visibleTanks);
        this.server.to(viewerId).emit('bulletState', visibleBullets);
        // Combined packet (optional on client)
        this.server.to(viewerId).emit('state', {
          tankState: visibleTanks,
          bulletState: visibleBullets,
        });
      }
    }
  }
}
