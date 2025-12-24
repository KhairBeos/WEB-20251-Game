/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { TILE_SIZE, MAP_ROWS, MAP_COLS, MapData } from 'src/websockets/model/MapData';
import { Tank } from '../model/Tank';

interface CollisionInfo {
  distance: number;
  overlap: number;
  distX: number;
  distY: number;
}

export function tankWallCollision(
  mapData: MapData,
  tankStates: { [playerId: string]: Tank },
  server: any,
) {
  const map = mapData.map;
  for (const id in tankStates) {
    const tank = tankStates[id];
    const R = tank.radius;
    // Xác định các ô mà tank có thể va chạm dựa trên vị trí và bán kính
    const leftCol = Math.floor((tank.x - R) / TILE_SIZE);
    const rightCol = Math.floor((tank.x + R) / TILE_SIZE);
    const topRow = Math.floor((tank.y - R) / TILE_SIZE);
    const bottomRow = Math.floor((tank.y + R) / TILE_SIZE);

    let inBush = 'none';
    let closestCollision: CollisionInfo | null = null;

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
        if (val >= 11 && val <= 14) {
          inBush = `bush_${rootR}_${rootC}`;
          continue;
        }

        // Nếu là item pickup (101..104)
        if (val >= 101 && val <= 104) {
          if (tank.itemKind !== 'none') continue; // Đang có item rồi, không nhặt thêm
          switch (root.val) {
            case 101: // health
              tank.health = Math.min(tank.maxHealth, tank.health + 50);
              tank.itemKind = 'health';
              tank.itemExpire = Date.now() + 2000; // 2s
              map[rootR][rootC] = { root_r: -1, root_c: -1, val: 0 };
              mapData.itemNumber--;
              server.emit('mapUpdate', { r: rootR, c: rootC, cell: map[rootR][rootC] });
              break;
            case 102: // shield
              tank.shield = Math.min(tank.shield + 50, 50);
              tank.itemKind = 'shield';
              tank.itemExpire = Date.now() + 10000; // 10s
              map[rootR][rootC] = { root_r: -1, root_c: -1, val: 0 };
              mapData.itemNumber--;
              server.emit('mapUpdate', { r: rootR, c: rootC, cell: map[rootR][rootC] });
              break;
            case 103: // speed boost
              tank.itemKind = 'speed';
              tank.itemExpire = Date.now() + 10000; // 10s
              map[rootR][rootC] = { root_r: -1, root_c: -1, val: 0 };
              mapData.itemNumber--;
              server.emit('mapUpdate', { r: rootR, c: rootC, cell: map[rootR][rootC] });
              break;
            case 104: // damage boost
              tank.itemKind = 'damage';
              tank.itemExpire = Date.now() + 10000; // 10s
              map[rootR][rootC] = { root_r: -1, root_c: -1, val: 0 };
              mapData.itemNumber--;
              server.emit('mapUpdate', { r: rootR, c: rootC, cell: map[rootR][rootC] });
              break;
          }
        }

        // Các vật thể còn lại coi là vật cản: tường/tower (1..4), cây viền (10)
        if (val > 0) {
          // Tính toán vị trí của ô
          const tileX = col * TILE_SIZE + TILE_SIZE / 2;
          const tileY = row * TILE_SIZE + TILE_SIZE / 2;

          // Tính khoảng cách từ tâm tank đến tâm ô
          const distX = tank.x - tileX;
          const distY = tank.y - tileY;

          const distance = Math.sqrt(distX * distX + distY * distY);

          if (distance === 0) {
            tank.x += tank.radius;
            tank.y += tank.radius;
            continue;
          }

          const minDistance = R + TILE_SIZE / 2;

          if (distance < minDistance) {
            // Va chạm xảy ra, tính toán overlap
            const overlap = minDistance - distance;
            
            // Chỉ giữ va chạm gần nhất (overlap lớn nhất)
            if (!closestCollision || overlap > closestCollision.overlap) {
              closestCollision = {
                distance,
                overlap,
                distX,
                distY,
              };
            }
          }
        }
      }
    }

    // Chỉ xử lý va chạm gần nhất để tránh rung lắc
    if (closestCollision) {
      const { distance, overlap, distX, distY } = closestCollision;
      
      // Threshold: chỉ adjust nếu overlap > 5px để tránh micro-oscillation
      if (overlap > 5) {
        // Relaxation rất thấp: 15% để giảm oscillation
        const relaxation = 0.15;
        const adjustX = (distX / distance) * overlap * relaxation;
        const adjustY = (distY / distance) * overlap * relaxation;
        
        tank.x += adjustX;
        tank.y += adjustY;
      }
    }

    // Cập nhật trạng thái inBush của tank
    tank.inBush = inBush;
  }
}
