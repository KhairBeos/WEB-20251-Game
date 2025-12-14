import { Bullet } from '../model/Bullet';
import { Tank } from '../model/Tank';
import { GridSpatial } from '../utils/GridSpartial';

export function bulletVSTankCollision(tankStates: { [playerId: string]: Tank } , bulletState: { [playerId: string]: Bullet }, grid: GridSpatial) {
    for (const bid in bulletState) {
        const bullet = bulletState[bid];
        const nearbyTanks = grid.getTanksNear(bullet.x, bullet.y);
        for (const tank of nearbyTanks) {
           
            // Bỏ qua nếu tank là chủ sở hữu viên đạn
            if (tank.id === bullet.ownerId) continue;
            const dx = tank.x - bullet.x;
            const dy = tank.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = tank.radius + Math.max(bullet.width, bullet.height) / 2;
            if (distance < minDistance) {
                // Xử lý va chạm: giảm máu tank và loại bỏ viên đạn
                tankStates[tank.id].health -= bullet.damage;
                delete bulletState[bid];
                if(tankStates[tank.id].health < 0) {
                    tankStates[bullet.ownerId].score += 10; // Cộng điểm cho người bắn
                }

                break; // Viên đạn đã va chạm, không cần kiểm tra với các tank khác
            }
        }
    }
}
