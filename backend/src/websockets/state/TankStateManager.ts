import { MAP_ROWS, MAP_COLS, TILE_SIZE, MapCell } from '../model/MapData';
import { TankState, TankInputBuffer } from '../model/Tank';
import { tankCollision } from '../collision/TankCollision';
import { tankWallCollision } from '../collision/TankWallCollision';

const TANK_ROTATE_SPEED = 3;
const SPEED = 4;
const SHOOT_COOLDOWN = 1000;

export class TankStateManager {
  update(
    tankState: TankState,
    tankInputBuffer: TankInputBuffer,
    currentMap: MapCell[][],
    handleBulletFire: (
      pid: string,
      payload: {
        clientTimestamp: number;
        startX: number;
        startY: number;
        width: number;
        height: number;
        degree: number;
        speed: number;
        damage: number;
      },
    ) => void,
  ) {
    for (const pid in tankInputBuffer) {
      const tank = tankState.tankStates[pid];
      if (!tank) continue;
      let inputs = tankInputBuffer[pid];
      inputs = inputs.filter((i) => Date.now() - i.clientTimestamp <= 100);

      let newDegree = tank.degree;
      for (const input of inputs) {
        // xoay
        switch (input.rotate) {
          case 'left':
            newDegree = (newDegree - TANK_ROTATE_SPEED + 360) % 360;
            break;
          case 'right':
            newDegree = (newDegree + TANK_ROTATE_SPEED + 360) % 360;
            break;
        }
        const angleInRadians = newDegree * (Math.PI / 180);
        // di chuyển
        let deltaX = 0,
          deltaY = 0;
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

        // va chạm giữa các tank
        tankCollision(tankState.tankStates, tank);
        // va chạm map (tower/tree, bỏ qua bush)
        tankWallCollision(currentMap, tank);

        // cập nhật trạng thái bụi
        const rc = { r: Math.floor(tank.y / TILE_SIZE), c: Math.floor(tank.x / TILE_SIZE) };
        if (rc.r >= 0 && rc.r < MAP_ROWS && rc.c >= 0 && rc.c < MAP_COLS) {
          const cell = currentMap[rc.r][rc.c];
          let rootR: number;
          let rootC: number;
          let rootVal: number;
          if (cell.val === 99) {
            rootR = cell.root_r;
            rootC = cell.root_c;
            if (rootR < 0 || rootR >= MAP_ROWS || rootC < 0 || rootC >= MAP_COLS) {
              tank.inBush = false;
              tank.bushRootR = undefined;
              tank.bushRootC = undefined;
              continue;
            }
            rootVal = currentMap[rootR][rootC].val;
          } else {
            rootR = rc.r;
            rootC = rc.c;
            rootVal = cell.val;
          }
          if (rootVal >= 11 && rootVal <= 14) {
            tank.inBush = true;
            tank.bushRootR = rootR;
            tank.bushRootC = rootC;
          } else {
            tank.inBush = false;
            tank.bushRootR = undefined;
            tank.bushRootC = undefined;
          }
        } else {
          tank.inBush = false;
          tank.bushRootR = undefined;
          tank.bushRootC = undefined;
        }

        // bắn
        const now = Date.now();
        if (input.isFire) {
          const timeSinceLastShot = now - tank.lastShootTimestamp;
          if (timeSinceLastShot >= SHOOT_COOLDOWN) {
            tank.lastShootTimestamp = now;
            handleBulletFire(pid, {
              clientTimestamp: now,
              startX: tank.x + (tank.width / 2) * Math.sin(angleInRadians),
              startY: tank.y + (tank.height / 2) * -Math.cos(angleInRadians),
              width: 32,
              height: 36,
              degree: tank.degree,
              speed: 10,
              damage: 10,
            });
          }
        }
      }
    }
    // clear inputs
    for (const playerId in tankInputBuffer) {
      tankInputBuffer[playerId] = [];
    }
  }
}
