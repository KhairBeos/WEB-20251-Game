import { Bullet } from '../model/Bullet';
import { Tank } from '../model/Tank';
import { GridSpatial } from '../utils/GridSpartial';

export function bulletVSTankCollision(
  tankStates: { [playerId: string]: Tank },
  bulletState: { [playerId: string]: Bullet },
  grid: GridSpatial,
  server: any,
) {
  for (const bid in bulletState) {
    const bullet = bulletState[bid];
    const nearbyTanks = grid.getTanksNear(bullet.x, bullet.y);
    // console.log(
    //   `Bullet ${bid} is near tanks:`,
    //   nearbyTanks.map((t) => t.id),
    // );
    for (const tank of nearbyTanks) {
      //console.log(`Checking collision between bullet ${bid} and tank ${tank.id}`);
      // Bỏ qua nếu tank là chủ sở hữu viên đạn
      if (tank.id === bullet.ownerId) continue;
      const dx = tank.x - bullet.x;
      const dy = tank.y - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = tank.radius + Math.max(bullet.width, bullet.height) / 2;
      if (distance < minDistance) {
        // Xử lý va chạm: trừ khiên trước, sau đó trừ máu
        const t = tankStates[tank.id];
        let dmg = bullet.damage;
        const shield = t.shield || 0;
        if (shield > 0) {
          const absorb = Math.min(shield, dmg);
          t.shield = shield - absorb;
          dmg -= absorb;
        }
        if (dmg > 0) {
          t.health -= dmg;
          if (t.health <= 0) {
            const shooter = tankStates[bullet.ownerId];

            if (shooter) {
              shooter.score += 10;
              shooter.xp += 10;
            }
          }
        }
        server.emit('hitTank', tank.id);
        delete bulletState[bid];
        break; // Viên đạn đã va chạm, không cần kiểm tra với các tank khác
      }
    }
  }
}
