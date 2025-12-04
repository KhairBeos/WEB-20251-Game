import { MapCell, TILE_SIZE, MAP_ROWS, MAP_COLS } from 'src/websockets/model/MapData';
import { Tank } from '../model/Tank';

export function tankWallCollision(map: MapCell[][], tankStates: { [playerId: string]: Tank }) {
  for (const id in tankStates) {
    const tank = tankStates[id];
    const R = tank.radius;
    // Xác định các ô mà tank có thể va chạm dựa trên vị trí và bán kính
    const leftCol = Math.floor((tank.x - R) / TILE_SIZE);
    const rightCol = Math.floor((tank.x + R) / TILE_SIZE);
    const topRow = Math.floor((tank.y - R) / TILE_SIZE);
    const bottomRow = Math.floor((tank.y + R) / TILE_SIZE);

    var inBush = "none";

    for (let row = topRow; row <= bottomRow; row++) {
      for (let col = leftCol; col <= rightCol; col++) {
        if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) {
          continue; // Bỏ qua các ô ngoài bản đồ
        }
        const cell = map[row][col];

        // Xác định ô gốc của vật thể (nếu là thân 99, tra ngược về gốc)
        const rootR = cell.val === 99 ? cell.root_r : row;
        const rootC = cell.val === 99 ? cell.root_c : col;
        if (rootR < 0 || rootR >= MAP_ROWS || rootC < 0 || rootC >= MAP_COLS) {
          continue;
        }
        const root = map[rootR][rootC];
        const val = root.val;
       
        // Bỏ qua vật thể không va chạm: đất (0), spawn (9),
        if (val === 0 || val === 9) {
          continue;
        }
 
        // Nếu là bụi (11..14), set tank.inBush = true
        if((val >= 11 && val <= 14))
        {
          inBush = `bush_${rootR}_${rootC}`;
          continue
        }

        // Các vật thể còn lại coi là vật cản: tường/tower (1..4), cây viền (10)
        if (val > 0) {
          // Tính toán vị trí của ô
          const tileX = col * TILE_SIZE + TILE_SIZE / 2;
          const tileY = row * TILE_SIZE + TILE_SIZE / 2;
          //console.log(`Checking tank at (${tank.x.toFixed(2)}, ${tank.y.toFixed(2)}) against tile at (${tileX}, ${tileY})`);

          // Tính khoảng cách từ tâm tank đến tâm ô
          const distX = tank.x - tileX;
          const distY = tank.y - tileY;
          //console.log(`Distance to tile: dx=${distX.toFixed(2)}, dy=${distY.toFixed(2)}`);

          const distance = Math.sqrt(distX * distX + distY * distY);
          const minDistance = R + TILE_SIZE / 2;

          if (distance === 0) {
            tank.x += tank.radius;
            tank.y += tank.radius;
            continue;
          }
          // Kiểm tra nếu ô hiện tại là tường (giá trị > 0)
          if (map[row][col].val > 0) {
            // Tính toán vị trí của ô
            const tileX = col * TILE_SIZE + TILE_SIZE / 2;
            const tileY = row * TILE_SIZE + TILE_SIZE / 2;
            //console.log(`Checking tank at (${tank.x.toFixed(2)}, ${tank.y.toFixed(2)}) against tile at (${tileX}, ${tileY})`);

            // Tính khoảng cách từ tâm tank đến tâm ô
            const distX = tank.x - tileX;
            const distY = tank.y - tileY;
            //console.log(`Distance to tile: dx=${distX.toFixed(2)}, dy=${distY.toFixed(2)}`);

            const distance = Math.sqrt(distX * distX + distY * distY);
            const minDistance = R + TILE_SIZE / 2;

            if (distance === 0) {
              tank.x += tank.radius;
              tank.y += tank.radius;
              continue;
            }

            if (distance < minDistance) {
              // Va chạm xảy ra, tính toán lại vị trí của tank để tránh chồng lấn
              const overlap = minDistance - distance;
              const adjustX = (distX / distance) * overlap;
              const adjustY = (distY / distance) * overlap;
              tank.x += adjustX;
              tank.y += adjustY;
            }
            //console.log(`Tank at (${tank.x.toFixed(2)}, ${tank.y.toFixed(2)}) checked against tile (${col}, ${row})`);
          }
        }
      }
    }
    
    // Cập nhật trạng thái inBush của tank
    tank.inBush = inBush;
  }
}
