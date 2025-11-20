import { Bullet, Tank } from "../game.service";
import { GridSpatial } from "../utils/GridSpartial";

export function bulletVSTankCollision(tanks: Tank[], bullets: Bullet[], grid: GridSpatial) {
    const collisions: { bulletId: string, tankId: string }[] = [];

    // Kiểm tra va chạm dựa trên lưới không gian
    bullets.forEach(bullet => {
        const cellKey = grid.getCellKey(bullet.x, bullet.y);
        const cell = grid.grid[cellKey];
        if (cell) {
            cell.tanks.forEach(tank => {
                // Không kiểm tra va chạm với tank của chính người bắn
                if (tank.id === bullet.ownerId) return;

                // Kiểm tra va chạm hình chữ nhật
                const distX = bullet.x - tank.x;
                const distY = bullet.y - tank.y;
                const halfWidth = tank.width / 2;
                const halfHeight = tank.height / 2;
                if (Math.abs(distX) <= halfWidth && Math.abs(distY) <= halfHeight) {
                    // Va chạm xảy ra
                    collisions.push({ bulletId: bullet.id, tankId: tank.id });
                }
            });
        }   
    });

    return collisions;

}