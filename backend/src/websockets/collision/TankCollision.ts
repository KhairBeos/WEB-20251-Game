import { Tank } from "../game.service";

export function tankCollision(tankStates: { [playerId: string]: Tank },tank:Tank, deltaX: number, deltaY: number) {
    for (const otherPlayerId in tankStates) {
        const otherTank = tankStates[otherPlayerId];
        // Không kiểm tra va chạm với chính nó
        if (otherTank === tank) continue;

        // Kiểm tra va chạm hình tròn với raidus
        const distX = (tank.x + deltaX) - otherTank.x;
        const distY = (tank.y + deltaY) - otherTank.y;
        
        const distance = Math.sqrt(distX * distX + distY * distY);
        const minDistance = tank.radius + otherTank.radius;

        if (distance < minDistance) {
            // Va chạm xảy ra, tính toán lại vị trí của tank để tránh chồng lấn
            const overlap = minDistance - distance;
            const adjustX = (distX / distance) * overlap;
            const adjustY = (distY / distance) * overlap;
            tank.x += adjustX;
            tank.y += adjustY;
        }   
    }
}