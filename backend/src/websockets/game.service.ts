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

  private sessions = new Map<string, any>();

  public tankState: TankState = {
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
  private disconnectTimestamps = new Map<string, number>();

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

    setInterval(() => {
        this.cleanupStaleSessions();
    }, 60 * 1000);
  }

  addPlayer(id: string, name: string, sessionId: string) {
    // Khởi tạo trạng thái input
    this.tankInputBuffer[id] = [];
    this.bulletInputBuffer[id] = [];

    const spawn = SPAWNPOINTS.length > 0
        ? SPAWNPOINTS[Math.floor(Math.random() * SPAWNPOINTS.length)]
        : { r: 6, c: 6 };

    this.logger.log(`Spawning player ${id} (${name}) at (${spawn.r}, ${spawn.c})`);

    // Xử lý tên
    let finalName = name?.trim().substring(0, 15);
    if (!finalName) finalName = `Guest_${id.substring(0, 4)}`;

    const newTank = {
      name: finalName,
      level: 1,
      score: 0,
      speed: 2,
      damage: 10,
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
      inBush: 'none',
      itemKind: 'none',
      itemExpire: 0,
      shield: 0,
    };

    this.tankState.tankStates[id] = newTank;

    if (sessionId) {
        this.sessions.set(sessionId, newTank);
    }

    console.log(`Player ${id} joined with Session ${sessionId}`);

    // Gửi Map ngay cho người mới
    if (this.server) {
      setTimeout(() => {
        this.server.to(id).emit('mapData', { map: this.currentMap });
      }, 100);
    }
  }

  restoreSession(sessionId: string, newSocketId: string) {
    const oldTank = this.sessions.get(sessionId);
    
    // Chỉ khôi phục nếu tìm thấy xác xe và xe chưa chết
    if (oldTank && oldTank.health > 0) {
        this.disconnectTimestamps.delete(sessionId);
        // Xóa xác xe ở socket cũ
        const oldSocketId = oldTank.id;
        delete this.tankState.tankStates[oldSocketId];

        // Cập nhật socket mới cho xe cũ
        oldTank.id = newSocketId;
        
        // Init lại buffer cho socket mới
        this.tankInputBuffer[newSocketId] = [];
        this.bulletInputBuffer[newSocketId] = [];

        // Đưa xe trở lại bản đồ
        this.tankState.tankStates[newSocketId] = oldTank;
        
        // Cập nhật lại kho session với object mới
        this.sessions.set(sessionId, oldTank);
        
        console.log(`Session Restored: ${oldTank.name} (Socket: ${oldSocketId} -> ${newSocketId})`);
        return oldTank;
    }
    return null;
  }

  killTank(socketId: string) {
      const tank = this.tankState.tankStates[socketId];
      if (tank) {
            for (const [sId, t] of this.sessions.entries()) {
                if (t === tank) {
                    this.sessions.delete(sId);
                    break;
                }
            }
      }
  }

  removePlayer(id: string) {
    console.log(`Player ${id} disconnected (Connection lost).`);

    delete this.tankState.tankStates[id];
    
    // Xóa buffer
    delete this.bulletInputBuffer[id];
    delete this.tankInputBuffer[id];

    for (const [sessId, tank] of this.sessions.entries()) {
          if (tank.id === id) {
              this.disconnectTimestamps.set(sessId, Date.now());
              break;
          }
      }
  }

  private cleanupStaleSessions() {
      const NOW = Date.now();
      const TIMEOUT = 5 * 60 * 1000; 

      for (const [sessId, time] of this.disconnectTimestamps.entries()) {
          // Nếu đã thoát quá 5 phút
          if (NOW - time > TIMEOUT) {
              console.log(`Dọn dẹp session rác: ${sessId}`);
              this.sessions.delete(sessId);           // Xóa session
              this.disconnectTimestamps.delete(sessId); // Xóa timestamp
          }
      }
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
    // Kiểm tra các tank đã chết
    for (const pid in this.tankState.tankStates) {
      const tank = this.tankState.tankStates[pid];
      if (tank.health <= 0) {
        // Báo cho client biết là đã chết (để hiện bảng Game Over)
         this.server.to(pid).emit('gameOver');
         
         // Xóa Session (để không Reconnect được nữa)
         this.killTank(pid);
         
         // Xóa khỏi map
         delete this.tankState.tankStates[pid];
         continue; // Chuyển sang tank tiếp theo
      }
    }

    // Cập nhât level dựa trên điểm số, mỗi 1 cấp độ 10 điểm
    for (const pid in this.tankState.tankStates) {
      const tank = this.tankState.tankStates[pid];
      const newLevel = Math.floor(tank.score / 10) + 1;
      if (newLevel !== tank.level) {
        // console.log(
        //   `Player ${pid} score: ${tank.score}, leveling up from ${tank.level} to ${newLevel}`,
        // );
        const lvDiff = newLevel - tank.level;

        tank.level = newLevel;
        tank.maxHealth += lvDiff * 20;
        tank.damage += lvDiff * 1;
        tank.speed += lvDiff * 0.2;
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
