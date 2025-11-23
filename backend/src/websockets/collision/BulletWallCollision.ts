import { TILE_SIZE, MAP_ROWS, MAP_COLS } from 'src/Model/MapData';
import { Bullet } from '../model/Bullet';
import { Tank } from '../model/Tank';

// --- HELPER: Tìm ô gốc (Root) của vật thể to ---
function findRoot(r: number, c: number, map:any): { r: number; c: number; val: number } | null {
  // Quét ngược lên trên và trái để tìm ô gốc (Tower 2x2, Tree 3x3)
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2; j++) {
      if (i === 0 && j === 0) continue;
      const nr = r - i;
      const nc = c - j;
      if (nr >= 0 && nc >= 0 && nr < MAP_ROWS && nc < MAP_COLS) {
        const val = map[nr][nc];
        // Tower (1-4) bán kính tìm 1 ô
        if (val >= 1 && val <= 4 && i < 2 && j < 2) return { r: nr, c: nc, val };
        // Tree (10) bán kính tìm 2 ô
        if (val === 10 && i < 3 && j < 3) return { r: nr, c: nc, val };
      }
    }
  }
  return null;
}

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
  map: number[][],
  bullet: Bullet,
  server: any,
): boolean {
  // --- XỬ LÝ BẮN TRÚNG MAP ---
  const c = Math.floor(bullet.x / TILE_SIZE);
  const r = Math.floor(bullet.y / TILE_SIZE);

  if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) {
    return true; // Đạn ra ngoài bản đồ
  }
  let tile = map[r][c];
  let root = { r, c, val: tile };

  // Tìm gốc nếu trúng thân
  if (tile === 99) {
    const found = findRoot(r, c, map);
    if (found) {
      root = found;
      tile = found.val;
    }
  }

  // 1. Bắn trúng Tường (1-4) -> Phá hủy
  if (tile >= 1 && tile <= 4) {
    map[root.r][root.c] -= 1; // Trừ máu
    const newVal = map[root.r][root.c];

    if (newVal === 0) {
      // Phá hủy hoàn toàn: Xóa cả 4 ô (2x2)
      map[root.r][root.c] = 0;
      map[root.r + 1][root.c] = 0;
      map[root.r][root.c + 1] = 0;
      map[root.r + 1][root.c + 1] = 0;

      // Update map cho client (gửi cả 4 ô)
      server.emit('mapUpdate', { r: root.r, c: root.c, val: 0 });
      server.emit('mapUpdate', { r: root.r + 1, c: root.c, val: 0 });
      server.emit('mapUpdate', { r: root.r, c: root.c + 1, val: 0 });
      server.emit('mapUpdate', { r: root.r + 1, c: root.c + 1, val: 0 });
    } else {
      // Chỉ nứt tường
      server.emit('mapUpdate', { r: root.r, c: root.c, val: newVal });
    }
    return true; // Xóa đạn
  }
  // 2. Bắn trúng Cây (10)
  else if (tile === 10) {
    if (checkCircleHit(bullet.x, bullet.y, 5, root.r, root.c)) {
      return true; // Xóa đạn
    }
  }
  return false;
}
