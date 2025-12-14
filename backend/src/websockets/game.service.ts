// src/game/game.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';

// Import MapData nội bộ (Copy file MapData vào backend/src/Model/MapData.ts trước nhé)
import { INITIAL_MAP, MapCell, SPAWNPOINTS, TILE_SIZE } from 'src/websockets/model/MapData';
import { bulletVSTankCollision } from './collision/BulletVSTankCollision';
import { tankCollision } from './collision/TankCollision';
import { tankWallCollision } from './collision/TankWallCollision';
import { BulletInput, BulletInputBuffer, BulletState } from './model/Bullet';
import { TankInput, TankInputBuffer, TankState } from './model/Tank';
import { GridSpatial } from './utils/GridSpartial';
import { bulletWallCollision } from './collision/BulletWallCollision';
import { MapService } from './map/MapService';
import { BulletStateManager } from './state/BulletStateManager';
import { TankStateManager } from './state/TankStateManager';
// import { VisibilityService } from './visibility/VisibilityService';

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

  // private visibilityService: VisibilityService;
  private mapService: MapService;
  private tankManager: TankStateManager;
  private bulletManager: BulletStateManager;
  private lastBroadcastTs: number | undefined;

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
      name: 'Anonymous',
      level: 1,
      score: 0,
      speed: 2,
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
        this.handleBulletFire.bind(this),
      );

      this.bulletManager.update(this.bulletState, this.bulletInputBuffer, this.tankState);

      this.gridSpatial.updateGrid(
        Object.values(this.tankState.tankStates),
        Object.values(this.bulletState.bulletStates).flatMap((bullets) => Object.values(bullets)),
      );

      tankCollision(this.tankState.tankStates, this.gridSpatial);
      tankWallCollision(this.currentMap, this.tankState.tankStates);
      bulletWallCollision(this.currentMap, this.bulletState.bulletStates,this.tankState ,this.server);
      bulletVSTankCollision(
        this.tankState.tankStates,
        this.bulletState.bulletStates,
        this.gridSpatial,
      );

      this.gameLogicLoop();

      this.tankState.serverTimestamp = Date.now();
      this.bulletState.serverTimestamp = Date.now();

      // console.log('Emitting tank and bullet states to clients');
      // console.log('Tank State:', this.tankState);
      this.server.emit('tankState', this.tankState);
      this.server.emit('bulletState', this.bulletState);
    }
  }

  private gameLogicLoop() {
    // Kiểm tra các tank đã chết
    for (const pid in this.tankState.tankStates) {
      const tank = this.tankState.tankStates[pid];
      if (tank.health <= 0) {
      }
    }

    // Cập nhât level dựa trên điểm số, mỗi 1 cấp độ 10 điểm
    for (const pid in this.tankState.tankStates) {
      const tank = this.tankState.tankStates[pid];
      const newLevel = Math.floor(tank.score / 10) + 1;
      if (newLevel !== tank.level) {
        console.log(`Player ${pid} score: ${tank.score}, leveling up from ${tank.level} to ${newLevel}`);
        tank.level = newLevel;
        tank.speed = 2 + (newLevel - 1) * 0.2; // Tăng tốc độ theo level
        console.log(`Player ${pid} leveled up to ${newLevel}`);
      }
    }
  }
}
