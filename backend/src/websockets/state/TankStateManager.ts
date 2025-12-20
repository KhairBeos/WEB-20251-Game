import { TankState, TankInputBuffer } from '../model/Tank';

const TANK_ROTATE_SPEED = 3;
const BASE_SPEED = 4;
const SHOOT_COOLDOWN = 1000;

export class TankStateManager {
  update(
    tankState: TankState,
    tankInputBuffer: TankInputBuffer,
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
        ownerId: string;
        
      },
    ) => void,
    server: any,
  ) {
    // Xoa tanks hết máu
    for (const pid in tankState.tankStates) {
      const tank = tankState.tankStates[pid];
      if (tank.health <= 0) {
        delete tankState.tankStates[pid];
      }
    }

    // Xử lý input
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
        let deltaX = 0, deltaY = 0;
        let newSpeed = tank.speed;
        // nếu có item speed thì tăng tốc
        if (tank.itemKind === 'speed') newSpeed = tank.speed * 2;
        
        switch (input.direction) {
          case 'forward':
            deltaX = newSpeed * Math.sin(angleInRadians);
            deltaY = -newSpeed * Math.cos(angleInRadians);
            break;
          case 'backward':
            deltaX = -newSpeed * Math.sin(angleInRadians);
            deltaY = newSpeed * Math.cos(angleInRadians);
            break;
        }
        tank.x += deltaX;
        tank.y += deltaY;
        tank.degree = newDegree;

        // bắn
        const now = Date.now();
        if (input.isFire) {
          const timeSinceLastShot = now - tank.lastShootTimestamp;
          let newDamage = tank.damage;
          // nếu có item damage thì tăng damage
          if (tank.itemKind === 'damage') newDamage = tank.damage * 2;
          if (timeSinceLastShot >= SHOOT_COOLDOWN) {
            tank.lastShootTimestamp = now;
            console.log(`Tank ${pid} fired a bullet.`);
            server.emit('fireBullet', pid);
            handleBulletFire(pid, {
              clientTimestamp: now,
              startX: tank.x + (tank.width / 2) * Math.sin(angleInRadians),
              startY: tank.y + (tank.height / 2) * -Math.cos(angleInRadians),
              width: 32,
              height: 36,
              degree: tank.degree,
              speed: tank.speed * 2,
              damage: newDamage,
              ownerId: pid,
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
