import { BulletState, BulletInputBuffer } from '../model/Bullet';
import { TankState } from '../model/Tank';
import { BulletPool } from '../utils/BulletPool';

const MAX_BULLET_DISTANCE = 1000; // max distance before bullet disappears (~37 tiles)
const MAX_BULLET_LIFETIME = 4000; // max lifetime in ms

export class BulletStateManager {
  update(
    bulletState: BulletState,
    bulletInputBuffer: BulletInputBuffer,
    tankState: TankState,
    pool: BulletPool,
  ) {
    const bullets = bulletState.bulletStates;
    const now = Date.now();

    // Process new bullet inputs
    for (const pid in bulletInputBuffer) {
      const tank = tankState.tankStates[pid];
      let inputs = bulletInputBuffer[pid];
      inputs.sort((a, b) => a.clientTimestamp - b.clientTimestamp);
      inputs = inputs.filter((i) => now - i.clientTimestamp <= 100);

      // Spawn bullets
      for (const i of inputs) {
        const numBullets = Math.floor(tank.level / 5) + 1;

        for (let b = 0; b < numBullets; b++) {
          const spreadAngle = (b - (numBullets - 1) / 2) * 20;
          const bullet = pool.acquire();
          if (!bullet) continue; // pool exhausted; skip spawn to avoid GC pressure
          const bid = `b_${pid}_${i.clientTimestamp}_${Math.random()}`;
          bullet.id = bid;
          bullet.ownerId = pid;
          bullet.x = i.startX;
          bullet.y = i.startY;
          bullet.width = i.width;
          bullet.height = i.height;
          bullet.degree = i.degree + spreadAngle;
          bullet.speed = i.speed;
          bullet.damage = tank.damage;
          bullet.lastTimeFired = i.clientTimestamp;
          bullet.totalDistance = 0; // reset distance
          bullets[bid] = bullet;
        }
      }
      bulletInputBuffer[pid] = [];
    }

    // Update all bullets
    for (const bid in bullets) {
      const b = bullets[bid];
      b.x += b.speed * Math.sin((b.degree * Math.PI) / 180);
      b.y -= b.speed * Math.cos((b.degree * Math.PI) / 180);
      b.totalDistance += b.speed; // accumulate distance
    }

    // Remove expired or out-of-range bullets
    for (const bid in bullets) {
      const b = bullets[bid];
      const lifetime = now - b.lastTimeFired;

      // Remove if:
      // 1. exceeded max lifetime (5s)
      // 2. exceeded max distance (3200px = 1 map width)
      if (lifetime > MAX_BULLET_LIFETIME || b.totalDistance > MAX_BULLET_DISTANCE) {
        pool.release(b);
        delete bullets[bid];
      }
    }
  }
}
