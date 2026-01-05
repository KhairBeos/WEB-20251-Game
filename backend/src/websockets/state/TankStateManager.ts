import { BulletInput, BulletInputBuffer } from '../model/Bullet';
import { TankState, TankInputBuffer, levelUpScores } from '../model/Tank';

const TANK_ROTATE_SPEED = 3;
const BASE_SPEED = 4;
const SHOOT_COOLDOWN = 1000;

export class TankStateManager {
  update(
    tankState: TankState,
    tankInputBuffer: TankInputBuffer,
    bulletInputBuffer: BulletInputBuffer,
    server: any,
  ) {
    const tankStates = tankState.tankStates;
    // Xoa tanks hết máu
    for (const pid in tankStates) {
      const tank = tankStates[pid];
      if (tank.health <= 0) {
        delete tankStates[pid];
        server.emit('gameOver', pid);
      }
    }

    for (const pid in tankStates) {
      const tank = tankStates[pid];
      // Kiếm tra lên cấp max 50
      if (tank.xp >= levelUpScores[tank.level+1] && tank.level < 50) {
        tank.xp -= levelUpScores[tank.level+1];
        tank.level += 1;
        // Tăng thuộc tính khi lên cấp (random giữa 3 thuộc tính)
        const attrIncrease = Math.floor(Math.random() * 3);
        if (attrIncrease === 0) {
          tank.maxHealth += 10;
        } else if (attrIncrease === 1) {
          tank.damage += 1;
        }
        else if (attrIncrease === 2) {
          tank.speed += 0.1;
        }
        // tank.maxHealth += 10; // max máu thêm = 50 * 10 = 500 máu
        // tank.damage += 1; // damage thêm = 1 * 50 = 50 damage
        // tank.speed += 0.1; // speed thêm = 0.1 * 50 = 10 speed
        console.log(`Tank ${pid} leveled up to level ${tank.level}!`);
        console.log(`New stats - Health: ${tank.maxHealth}, Damage: ${tank.damage}, Speed: ${tank.speed}`);
      }
    }

    // Kiểm tra item expire
    const nowTs = Date.now();
    for (const pid in tankStates) {
      const tank = tankStates[pid];
      if (tank.itemKind !== 'none' && tank.itemExpire && nowTs > tank.itemExpire) {
        tank.shield = 0;
        tank.itemKind = 'none';
        tank.itemExpire = 0;
      }
    }

    // Xử lý input
    for (const pid in tankInputBuffer) {
      const tank = tankState.tankStates[pid];
      if (!tank) continue;

      let inputs = tankInputBuffer[pid];
      inputs = inputs.filter((i) => Date.now() - i.clientTimestamp <= 10000);

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
            const bulletInput: BulletInput = {
              clientTimestamp: now,
              startX: tank.x + (tank.width / 2) * Math.sin(angleInRadians),
              startY: tank.y + (tank.height / 2) * -Math.cos(angleInRadians),
              width: 32,
              height: 36,
              degree: tank.degree,
              speed: newSpeed,
              damage: newDamage,
              ownerId: pid,
            };
            bulletInputBuffer[pid].push(bulletInput);
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
