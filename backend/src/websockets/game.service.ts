// src/game/game.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';

// Import MapData nội bộ (Copy file MapData vào backend/src/Model/MapData.ts trước nhé)
import { INITIAL_MAP, MapCell, SPAWNPOINTS, TILE_SIZE } from 'src/websockets/model/MapData';
import { bulletVSTankCollision } from './collision/BulletVSTankCollision';
import { tankCollision } from './collision/TankCollision';
import { tankWallCollision } from './collision/TankWallCollision';
import { BulletInput, BulletInputBuffer, BulletState, Bullet } from './model/Bullet';
import { TankInput, TankInputBuffer, TankState } from './model/Tank';
import { GridSpatial } from './utils/GridSpartial';
import { bulletWallCollision } from './collision/BulletWallCollision';
import { MapService } from './service/MapService';
import { BulletStateManager } from './state/BulletStateManager';
import { TankStateManager } from './state/TankStateManager';
import { PickupService } from './service/PickupService';
import { TowerService } from './service/TowerService';
import { BushService } from './service/BushService';

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

  // private visibilityService: VisibilityService;
  private mapService: MapService;
  private tankManager: TankStateManager;
  private bulletManager: BulletStateManager;
  private pickupService: PickupService;
  private towerService: TowerService;
  private bushService: BushService;

  private gridSpatial: GridSpatial = new GridSpatial();

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
    // this.visibilityService = new VisibilityService(this.currentMap);
    this.mapService = new MapService(this.currentMap);
    this.tankManager = new TankStateManager();
    this.bulletManager = new BulletStateManager();
    this.pickupService = new PickupService(this.currentMap, this.server);
    this.towerService = new TowerService(this.currentMap, this.server);
    this.bushService = new BushService(this.currentMap, this.server);
    setInterval(() => this.gameLoop(), this.GAME_TICK_RATE);

    // Spawn initial pickups (3 items at start)
    for (let i = 0; i < 3; i++) {
      this.pickupService.spawnRandomPickup();
    }

    // Định kỳ: di chuyển lại một số bụi sang vị trí ngẫu nhiên
    setInterval(() => {
      try {
        this.bushService.relocateBushes(8); // đổi vị trí 8 cụm bụi mỗi chu kỳ
      } catch {
        // swallow errors to keep timer alive
      }
    }, 30000); // 30s

    // Spawn new pickups periodically (every 10 seconds) to keep items on map
    setInterval(() => {
      try {
        this.pickupService.spawnRandomPickup();
      } catch {
        // swallow errors to keep timer alive
      }
    }, 10000); // 10s
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
      name: 'Anonymous',
      level: 1,
      score: 0,
      speed: 2,
      damage: 10,
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
      inBush: 'none',
      itemKind: 'none',
      itemExpire: 0,
      shield: 0,
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
    console.log(`Received bullet fire input from player ${id}:`, bulletInput);
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
    // Gửi trạng thái game MỚI đến tất cả client
    if (this.server) {
      this.tankManager.update(
        this.tankState,
        this.tankInputBuffer,
        this.handleBulletFire.bind(this) as unknown as (pid: string, payload: any) => void,
        this.server,
      );

      this.bulletManager.update(this.bulletState, this.bulletInputBuffer, this.tankState);

      this.gridSpatial.updateGrid(
        Object.values(this.tankState.tankStates),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        (Object.values(this.bulletState.bulletStates) as any).flatMap(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-argument
          (bullets: any) => Object.values(bullets) as any,
        ) as Bullet[],
      );

      tankCollision(this.tankState.tankStates);
      tankWallCollision(this.currentMap, this.tankState.tankStates, this.server);

      // Callback: khi tường phá hủy, xử lý pickup drop + respawn tower
      // const onTowerDestroyed = (rootR: number, rootC: number) => {
      //   this.towerService.onTowerDestroyed(rootR, rootC);
      // };
      bulletWallCollision(
        this.currentMap,
        this.bulletState.bulletStates,
        this.tankState,
        this.server,
      );

      bulletVSTankCollision(
        this.tankState.tankStates,
        this.bulletState.bulletStates,
        this.gridSpatial,
        this.server
      );

      this.gameLogicLoop();
      // Pickups: handle detection and effects via service

      this.tankState.serverTimestamp = Date.now();
      this.bulletState.serverTimestamp = Date.now();

      // console.log('Emitting tank and bullet states to clients');
      // console.log('Tank State:', this.tankState);
      this.server.emit('tankState', this.tankState);
      this.server.emit('bulletState', this.bulletState);
    }
  }

  private gameLogicLoop() {
    
    // Cập nhât level dựa trên điểm số, mỗi 1 cấp độ 10 điểm
    for (const pid in this.tankState.tankStates) {
      const tank = this.tankState.tankStates[pid];
      const newLevel = Math.floor(tank.score / 10) + 1;
      if (newLevel !== tank.level) {
        const lvDiff = newLevel - tank.level;

        tank.level = newLevel;
        tank.maxHealth += lvDiff * 20;
        tank.damage += lvDiff * 1;
        tank.speed += lvDiff * 0.2;

        tank.damage = Math.min(tank.damage, 50); // giới hạn damage max
        tank.speed = Math.min(tank.speed, 20); // giới hạn speed max
        // console.log(`Player ${pid} leveled up to ${newLevel}`);
      }
    }

    // Kiểm tra item expire
    const nowTs = Date.now();
    for (const pid in this.tankState.tankStates) {
      const tank = this.tankState.tankStates[pid];
      if (tank.itemKind !== 'none' && tank.itemExpire && nowTs > tank.itemExpire) {
        tank.shield = 0;
        tank.itemKind = 'none';
        tank.itemExpire = 0;
      }
    }
  }
}
