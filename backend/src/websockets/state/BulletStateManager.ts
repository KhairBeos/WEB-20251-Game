import { Bullet, BulletInputBuffer, BulletState } from '../model/Bullet';
import { TankState } from '../model/Tank';



export class BulletStateManager {
  update(
    bulletState: BulletState,
    bulletInputBuffer: BulletInputBuffer,
    tankState: TankState,
  ) {
    const bullets = bulletState.bulletStates;

    for (const pid in bulletInputBuffer) {
      const tank = tankState.tankStates[pid];
      let inputs = bulletInputBuffer[pid];
      const now = Date.now();
      inputs.sort((a, b) => a.clientTimestamp - b.clientTimestamp);
      inputs = inputs.filter((i) => now - i.clientTimestamp <= 10000);

      // Tạo đạn
      for (const i of inputs) {
        // console.log(`Creating bullet for player ${pid} with input:`, i);
        var numBullets = Math.floor(tank.level / 7) + 1; // Mỗi 7 level thêm 1 đạn
        numBullets = Math.min(numBullets, 8); // Giới hạn tối đa 8 đạn
        
        for (let b = 0; b < numBullets; b++) {
          const spreadAngle = (b - (numBullets - 1) / 2) * 20;
          const bid = `b_${pid}_${i.clientTimestamp}_${Math.random()}`;
          bullets[bid] = {
            id: bid,
            ownerId: pid,
            x: i.startX,
            y: i.startY,
            width: i.width,
            height: i.height,
            degree: i.degree + spreadAngle,
            speed: i.speed,
            damage: tank.damage,
            lastTimeFired: i.clientTimestamp,
          } as Bullet;
        }
      }
      bulletInputBuffer[pid] = [];
      // Update đạn
      for (const bid in bullets) {
        const b = bullets[bid];
        b.x += b.speed * Math.sin((b.degree * Math.PI) / 180);
        b.y -= b.speed * Math.cos((b.degree * Math.PI) / 180);
      }

      // Kiểm tra đạn tồn tại quá lâu (5 giây)
      for (const bid in bullets) {
        const b = bullets[bid];
        if (now - b.lastTimeFired > 5000) {
          delete bullets[bid];
        }
      }
    }
  }
}
