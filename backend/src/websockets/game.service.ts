// src/game/game.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';

// Import MapData nội bộ (Copy file MapData vào backend/src/Model/MapData.ts trước nhé)
import { generateMap, MapCell, MapData, SPAWNPOINTS, TILE_SIZE } from 'src/websockets/model/MapData';
import { bulletVSTankCollision } from './collision/BulletVSTankCollision';
import { tankCollision } from './collision/TankCollision';
import { tankWallCollision } from './collision/TankWallCollision';
import { BulletInput, BulletInputBuffer, BulletState, Bullet } from './model/Bullet';
import { createInitialTank, TankInput, TankInputBuffer, TankState } from './model/Tank';
import { GridSpatial } from './utils/GridSpartial';
import { bulletWallCollision } from './collision/BulletWallCollision';
import { MapService } from './service/MapService';
import { BulletStateManager } from './state/BulletStateManager';
import { TankStateManager } from './state/TankStateManager';
import { PickupService } from './service/PickupService';
import { TowerService } from './service/TowerService';
import { BushService } from './service/BushService';
import { create } from 'domain';

@Injectable()
export class GameService implements OnModuleInit {
  private currentMap: MapData;

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
  private itemNumber = 0;

  setServer(server: Server) {
    this.server = server;
  }

  onModuleInit() {
    // Deep copy map gốc
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.currentMap = JSON.parse(JSON.stringify(generateMap()));
    // init services
    // this.visibilityService = new VisibilityService(this.currentMap);
    this.mapService = new MapService(this.currentMap.map);
    this.tankManager = new TankStateManager();
    this.bulletManager = new BulletStateManager();
    this.pickupService = new PickupService(this.currentMap, this.server);
    this.towerService = new TowerService(this.currentMap.map, this.server);
    this.bushService = new BushService(this.currentMap.map, this.server);
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

    const newTank = createInitialTank(id, `Player_${id.substring(0, 4)}`);
    this.tankState.tankStates[id] = newTank;

    console.log(`Player ${id} joined.`);
    console.log(`Initial Tank State:`, this.tankState.tankStates[id]);

    // Gửi Map ngay cho người mới
    if (this.server) {
      setTimeout(() => {
        this.server.to(id).emit('mapData', { map: this.currentMap.map });
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
      this.tankManager.update(this.tankState,this.tankInputBuffer,this.bulletInputBuffer,this.server);

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
      bulletWallCollision(
        this.currentMap.map,
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

      this.tankState.serverTimestamp = Date.now();
      this.bulletState.serverTimestamp = Date.now();

      // console.log('Emitting tank and bullet states to clients');
      // console.log('Tank State:', this.tankState);
      this.server.emit('tankState', this.tankState);
      this.server.emit('bulletState', this.bulletState);
    }
  }
}
