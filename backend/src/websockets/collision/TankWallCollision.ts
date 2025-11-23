import { Tank } from "../model/Tank";

export function tankWallCollision(map: number[][], tank: Tank, tileSize: number) {
    const R = tank.radius;
    // Xác định các ô mà tank có thể va chạm dựa trên vị trí và bán kính
    const leftCol = Math.floor((tank.x - R) / tileSize);
    const rightCol = Math.floor((tank.x + R) / tileSize);
    const topRow = Math.floor((tank.y - R) / tileSize);
    const bottomRow = Math.floor((tank.y + R) / tileSize);

    for (let row = topRow; row <= bottomRow; row++) {
        for (let col = leftCol; col <= rightCol; col++) {
            // Kiểm tra nếu ô hiện tại là tường (giá trị > 0)
            if (map[row] && map[row][col] && map[row][col] > 0) {
                // Tính toán vị trí của ô
                const tileX = col * tileSize + tileSize / 2;
                const tileY = row * tileSize + tileSize / 2;
                // Tính khoảng cách từ tâm tank đến tâm ô
                const distX = tank.x - tileX;
                const distY = tank.y - tileY;
                const distance = Math.sqrt(distX * distX + distY * distY);
                const minDistance = R + tileSize / 2;
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
       
    }

}