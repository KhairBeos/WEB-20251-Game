import { TILE_SIZE, MAP_ROWS, MAP_COLS, MapCell } from 'src/Model/MapData';
import { Bullet } from '../model/Bullet';
import { Tank } from '../model/Tank';

// --- HELPER: Check va chạm HÌNH TRÒN (Cho Cây) ---
function checkCircleHit(
  objX: number,
  objY: number,
  objRadius: number,
  treeRootR: number,
  treeRootC: number,
): boolean {
  // Tâm cây nằm giữa vùng 3x3 (1.5 ô từ gốc)
  const treeCenterX = treeRootC * TILE_SIZE + 1.5 * TILE_SIZE;
  const treeCenterY = treeRootR * TILE_SIZE + 1.5 * TILE_SIZE;
  const treeRadius = 50; // Bán kính cây (nhỏ hơn 60 để dễ đi)

  const dx = objX - treeCenterX;
  const dy = objY - treeCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < treeRadius + objRadius;
}

export function bulletWallCollision(
  map: MapCell[][],
  bulletState: { [bulletId: string]: Bullet },
  server: any,
) {
  var removedBullets: string[] = [];
  for (const bid in bulletState) {
    const bullet = bulletState[bid];
    // --- XỬ LÝ BẮN TRÚNG MAP ---
    const c = Math.floor(bullet.x / TILE_SIZE);
    const r = Math.floor(bullet.y / TILE_SIZE);

    if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) {
      return true; // Đạn ra ngoài bản đồ
    }
    let tile = map[r][c];
    if (tile.val === 0) {
      return false; // Đạn bay qua đất trống
    }

    let root = map[tile.root_r][tile.root_c];
    let rootR = tile.root_r;
    let rootC = tile.root_c;

    // 1. Bắn trúng Tường (1-4) -> Phá hủy
    if (root.val >= 1 && root.val <= 4) {
      console.log(`Bullet ${bid} hit wall at (${r}, ${c})`);
      map[rootR][rootC].val -= 1; // Trừ máu
      const newVal = map[rootR][rootC].val;

      if (newVal === 0) {
        // Phá hủy hoàn toàn: Xóa cả 4 ô (2x2)
        map[rootR][rootC] = { root_r: -1, root_c: -1, val: 0 };
        map[rootR][rootC + 1] = { root_r: -1, root_c: -1, val: 0 };
        map[rootR + 1][rootC] = { root_r: -1, root_c: -1, val: 0 };
        map[rootR + 1][rootC + 1] = { root_r: -1, root_c: -1, val: 0 };

        // Update map cho client (gửi cả 4 ô)
        server.emit('mapUpdate', { r: rootR, c: rootC, cell: map[rootR][rootC] });
        server.emit('mapUpdate', { r: rootR, c: rootC + 1, cell: map[rootR][rootC + 1] });
        server.emit('mapUpdate', { r: rootR + 1, c: rootC, cell: map[rootR + 1][rootC] });
        server.emit('mapUpdate', { r: rootR + 1, c: rootC + 1, cell: map[rootR + 1][rootC + 1] });
      } else {
        // Chỉ nứt tường
        console.log(`map update cell at (${rootR}, ${rootC}) to cell=${newVal}`);
        console.log(map[rootR][rootC]);
        server.emit('mapUpdate', { r: rootR, c: rootC, cell: map[rootR][rootC] });
      }
      removedBullets.push(bid);
    }
    // 2. Bắn trúng Cây (10)
    else if (tile.val === 10) {
      if (checkCircleHit(bullet.x, bullet.y, 5, rootR, rootC)) {
        removedBullets.push(bid);
      }
    }
  }
  // Xóa các viên đạn đã va chạm
  for (const bid of removedBullets) {
    delete bulletState[bid];
  }
}
