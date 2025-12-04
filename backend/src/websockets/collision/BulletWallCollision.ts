import { TILE_SIZE, MAP_ROWS, MAP_COLS, MapCell } from 'src/websockets/model/MapData';
import { Bullet } from '../model/Bullet';

// Trước đây dùng hitbox tròn cho cây 3x3; nay cây (10) và bụi (11..14)
// là vật cản chữ nhật (1x2 và 3x2). Đạn chạm là dừng (không trừ máu).

export function bulletWallCollision(map: MapCell[][], bullet: Bullet, server: any): boolean {
  // --- XỬ LÝ BẮN TRÚNG MAP ---
  const c = Math.floor(bullet.x / TILE_SIZE);
  const r = Math.floor(bullet.y / TILE_SIZE);

  if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) {
    return true; // Đạn ra ngoài bản đồ
  }
  const tile = map[r][c];
  if (tile.val === 0) {
    return false; // Đạn bay qua đất trống
  }

  // Xác định ô gốc của vật thể tại vị trí đạn
  const rootR = tile.val === 99 ? tile.root_r : r;
  const rootC = tile.val === 99 ? tile.root_c : c;
  if (rootR < 0 || rootR >= MAP_ROWS || rootC < 0 || rootC >= MAP_COLS) {
    // Tọa độ gốc không hợp lệ -> coi như không va chạm map
    return false;
  }
  const root = map[rootR][rootC];

  // 1. Bắn trúng Tường (1-4) -> Phá hủy
  if (root.val >= 1 && root.val <= 4) {
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
    return true; // Xóa đạn
  }
  // 2. Cây viền (10) chặn đạn; BỤI (11..14) KHÔNG chặn đạn
  else if (root.val === 10) {
    return true; // Cây viền chặn đạn
  } else if (root.val >= 11 && root.val <= 14) {
    return false; // Bụi cho đạn đi xuyên
  }
  return false;
}
