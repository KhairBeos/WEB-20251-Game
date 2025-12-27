import { TILE_SIZE, MAP_ROWS, MAP_COLS, MapCell } from 'src/websockets/model/MapData';
import { Bullet } from '../model/Bullet';
import { Tank, TankState } from '../model/Tank';

// Trước đây dùng hitbox tròn cho cây 3x3; nay cây (10) và bụi (11..14)
// là vật cản chữ nhật (1x2 và 3x2). Đạn chạm là dừng (không trừ máu).

export function bulletWallCollision(
  map: MapCell[][],
  bulletState: { [bulletId: string]: Bullet },
  tankState: TankState,
  server: any,
  onTowerDestroyed?: (rootR: number, rootC: number) => void,
) {
  const removedBullets: string[] = [];
  for (const bid in bulletState) {
    const bullet = bulletState[bid];
    // --- XỬ LÝ BẮN TRÚNG MAP ---
    const c = Math.floor(bullet.x / TILE_SIZE);
    const r = Math.floor(bullet.y / TILE_SIZE);
    // console.log(`Bullet ${bid} at (${bullet.x.toFixed(2)}, ${bullet.y.toFixed(2)}) is in tile (${r}, ${c})`);

    if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) {
      removedBullets.push(bid); // Đạn bay ra ngoài bản đồ
      continue;
    }
    const tile = map[r][c];
    if (tile.val === 0) {
      continue; // Ô trống, đạn bay tiếp
    }

    // Kiểm tra root position hợp lệ
    if (tile.root_r < 0 || tile.root_r >= MAP_ROWS || tile.root_c < 0 || tile.root_c >= MAP_COLS) {
      return true; // Root position không hợp lệ
    }

    const root = map[tile.root_r][tile.root_c];
    const rootR = tile.root_r;
    const rootC = tile.root_c;

    // 1. Bắn trúng Tường (1-4) -> Phá hủy
    if (root.val >= 1 && root.val <= 4) {
      // console.log(`Bullet ${bid} hit wall at (${r}, ${c})`);
      map[rootR][rootC].val -= 1; // Trừ máu
      const newVal = map[rootR][rootC].val;

      if (newVal === 0) {
        const shooter = tankState.tankStates[bullet.ownerId];
        if (shooter) {
          shooter.score += 5;
          shooter.xp += 5;
        }
        // console.log(`Player ${bullet.ownerId} scored 5 points for destroying a wall. Total score: ${tankState.tankStates[bullet.ownerId].score}`);
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
        if (onTowerDestroyed) onTowerDestroyed(rootR, rootC);
      } else {
        // Chỉ nứt tường
        // console.log(`map update cell at (${rootR}, ${rootC}) to cell=${newVal}`);
        // console.log(map[rootR][rootC]);
        server.emit('mapUpdate', { r: rootR, c: rootC, cell: map[rootR][rootC] });
      }
      removedBullets.push(bid);
    }
    // 2. Cây viền (10) chặn đạn; BỤI (11..14) KHÔNG chặn đạn
    else if (root.val === 10) {
      removedBullets.push(bid); // Đạn dừng lại
    } else if (root.val >= 11 && root.val <= 14) {
      // Đạn bay qua bụi, không làm gì
    }
    // Xóa các viên đạn đã va chạm
    for (const bid of removedBullets) {
      delete bulletState[bid];
    }
  }
}
