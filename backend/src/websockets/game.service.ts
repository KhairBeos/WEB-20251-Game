
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { sessionStore } from 'src/auth/session.store';
import { generateMap, MapData } from 'src/websockets/model/MapData';
import { bulletVSTankCollision } from './collision/BulletVSTankCollision';
import { bulletWallCollision } from './collision/BulletWallCollision';
import { tankCollision } from './collision/TankCollision';
import { tankWallCollision } from './collision/TankWallCollision';
import { BulletInputBuffer, BulletState } from './model/Bullet';
import { createInitialTank, TankInput, TankInputBuffer, TankState } from './model/Tank';
import { BushService } from './service/BushService';
import { MapService } from './service/MapService';
import { PickupService } from './service/PickupService';
import { TowerService } from './service/TowerService';
import { BulletStateManager } from './state/BulletStateManager';
import { TankStateManager } from './state/TankStateManager';
import { GridSpatial } from './utils/GridSpartial';

@Injectable()
export class GameService implements OnModuleInit {
  private currentMap: MapData;

  private readonly logger = new Logger(GameService.name);

  private tankSessions = new Map<string, string>();

  public tankState: TankState = {
    serverTimestamp: 0,
    tankStates: {},
  };

  private bulletState: BulletState = {
    serverTimestamp: 0,
    bulletStates: {},
  };

  private mapService: MapService;
  private tankManager: TankStateManager;
  private bulletManager: BulletStateManager;
  private pickupService: PickupService;
  private towerService: TowerService;
  private bushService: BushService;

  private gridSpatial: GridSpatial = new GridSpatial();

  constructor() {}

  private tankInputBuffer: TankInputBuffer = {};
  private bulletInputBuffer: BulletInputBuffer = {};

  private server: Server;
  private readonly GAME_TICK_RATE = 1000 / 60;
  private itemNumber = 0;

  setServer(server: Server) {
    this.server = server;
  }

  getMap() {
    return this.currentMap;
  }

  getTank(id: string) {
    return this.tankState.tankStates[id];
  }

  onModuleInit() {
    this.currentMap = generateMap();
    // init services
    this.mapService = new MapService(this.currentMap.map);
    this.tankManager = new TankStateManager();
    this.bulletManager = new BulletStateManager();
    this.pickupService = new PickupService(this.currentMap, this.server);
    this.towerService = new TowerService(this.currentMap.map, this.server);
    this.bushService = new BushService(this.currentMap.map, this.server);
    setInterval(() => this.gameLoop(), this.GAME_TICK_RATE);

    // Định kỳ: di chuyển lại một số bụi sang vị trí ngẫu nhiên mỗi 60-120s
    setInterval(() => {
      try {
        const delay = 60000 + Math.random() * 60000; // 60-120s
        setTimeout(() => {
          this.bushService.relocateBushes(10); // di chuyển tối đa 10 bụi
        }, delay);
      } catch {
        // swallow errors to keep timer alive
      }
    }, 120000); // kiểm tra mỗi 2 phút

    // Spawn new pickups periodically (every 30 seconds) để duy trì tối đa 50 item
    setInterval(() => {
      try {
        this.pickupService.spawnRandomPickup();
      } catch {
        // swallow errors to keep timer alive
      }
    }, 30000); // 30s
  }

  addXp(playerId: string, xp: number) {
    const tank = this.tankState.tankStates[playerId];
    if(!tank) return;
    tank.xp += xp;
    console.log(`Player ${playerId} gained ${xp} XP. Total XP: ${tank.xp}`);
  }


  addPlayer(id: string, name: string, sessionId: string, skin: string) {
    // Kiểm tra session hợp lệ

    // Khởi tạo trạng thái input
    this.tankInputBuffer[id] = [];
    this.bulletInputBuffer[id] = [];

    const newTank = createInitialTank(id, name, skin);
    this.tankState.tankStates[id] = newTank;
    this.tankSessions.set(id, sessionId);

    console.log(`Player ${id} joined with Session ${sessionId}`);

    // Gửi Map ngay cho người mới
    if (this.server) {
      setTimeout(() => {
        this.server.to(id).emit('mapData', { map: this.currentMap.map });
      }, 100);
    }
  }

  removePlayer(id: string) {
    console.log(`Player ${id} disconnected (Connection lost).`);

    delete this.tankState.tankStates[id];

    // Xóa buffer
    delete this.bulletInputBuffer[id];
    delete this.tankInputBuffer[id];

    sessionStore.delete(this.tankSessions.get(id) || '');
    this.tankSessions.delete(id);
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
        this.bulletInputBuffer,
        this.server,
      );

      this.bulletManager.update(this.bulletState, this.bulletInputBuffer, this.tankState);

      this.gridSpatial.updateGrid(
        Object.values(this.tankState.tankStates),
        Object.values(this.bulletState.bulletStates),
      );

      tankCollision(this.tankState.tankStates);
      tankWallCollision(this.currentMap, this.tankState.tankStates, this.server);
      bulletWallCollision(
        this.currentMap.map,
        this.bulletState.bulletStates,
        this.tankState,
        this.server,
        this.towerService.onTowerDestroyed.bind(this.towerService)
      );

      bulletVSTankCollision(
        this.tankState.tankStates,
        this.bulletState.bulletStates,
        this.gridSpatial,
        this.server,
      );

      this.tankState.serverTimestamp = Date.now();
      this.bulletState.serverTimestamp = Date.now();

      this.server.emit('tankState', this.tankState);
      this.server.emit('bulletState', this.bulletState);
    }
  }
}
