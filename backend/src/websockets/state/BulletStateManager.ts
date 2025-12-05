import { BulletState, BulletInputBuffer, Bullet } from '../model/Bullet';
import { MapCell } from '../model/MapData';
import { bulletWallCollision } from '../collision/BulletWallCollision';

export class BulletStateManager {
  update(
    bulletState: BulletState,
    bulletInputBuffer: BulletInputBuffer,
  ) {
    
    const bullets = bulletState.bulletStates;

    for (const pid in bulletInputBuffer) {
      let inputs = bulletInputBuffer[pid];
      const now = Date.now();
      inputs = inputs.filter((i) => now - i.clientTimestamp <= 100);

      // Tạo đạn
      for (const i of inputs) {
        console.log(`Creating bullet for player ${pid} with input:`, i);
        const bid = `b_${pid}_${i.clientTimestamp}_${Math.random()}`;
        bullets[bid] = {
          id: bid,
          ownerId: pid,
          x: i.startX,
          y: i.startY,
          width: i.width,
          height: i.height,
          degree: i.degree,
          speed: i.speed,
          damage: i.damage,
        } as Bullet;
      }
      bulletInputBuffer[pid] = [];
      // Update đạn
      for (const bid in bullets) {
        const b = bullets[bid];
        b.x += b.speed * Math.sin((b.degree * Math.PI) / 180);
        b.y -= b.speed * Math.cos((b.degree * Math.PI) / 180);
      }
    }
  }
}
