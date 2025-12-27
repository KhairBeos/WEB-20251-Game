/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { MapCell, MAP_ROWS, MAP_COLS } from '../model/MapData';

export class BushService {
  private readonly MAX_BUSHES = 50;

  constructor(
    private map: MapCell[][],
    private server: any,
  ) {}

  // Đếm số bụi gốc hiện tại trên map
  private countBushes(): number {
    let count = 0;
    const visited = new Set<string>();
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const cell = this.map[r][c];
        if (cell.val >= 11 && cell.val <= 14 && cell.root_r === r && cell.root_c === c) {
          count++;
        }
      }
    }
    return count;
  }

  // Di chuyển lại N bụi (3x2) sang vị trí trống trong map
  relocateBushes(count: number) {
    const candidates: { r: number; c: number }[] = [];
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const cell = this.map[r][c];
        if (cell.val >= 11 && cell.val <= 14 && cell.root_r === r && cell.root_c === c) {
          candidates.push({ r, c });
        }
      }
    }
    if (candidates.length === 0) return;

    const actualCount = Math.min(count, candidates.length);

    for (let i = 0; i < actualCount; i++) {
      const idx = Math.floor(Math.random() * candidates.length);
      const { r, c } = candidates[idx];
      const root = this.map[r][c];
      if (!(root.val >= 11 && root.val <= 14)) continue;
      // Xóa cụm cũ 3x2
      for (let dr = 0; dr < 2; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr < MAP_ROWS && cc < MAP_COLS) {
            this.map[rr][cc] = { root_r: -1, root_c: -1, val: 0 };
            this.server?.emit('mapUpdate', { r: rr, c: cc, cell: this.map[rr][cc] });
          }
        }
      }
      // tìm vị trí mới 3x2 trống
      let placed = false;
      let guard = 0;
      while (!placed && guard++ < 3000) {
        const nr = Math.floor(Math.random() * (MAP_ROWS - 1));
        const nc = Math.floor(Math.random() * (MAP_COLS - 2));
        if (nr < 1 || nr > MAP_ROWS - 3 || nc < 1 || nc > MAP_COLS - 4) continue;
        let ok = true;
        for (let dr = 0; dr < 2; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            if (this.map[nr + dr][nc + dc].val !== 0) {
              ok = false;
              break;
            }
          }
          if (!ok) break;
        }
        if (!ok) continue;
        const variant = 11 + Math.floor(Math.random() * 4);
        this.map[nr][nc] = { root_r: nr, root_c: nc, val: variant };
        for (let dr = 0; dr < 2; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            if (dr === 0 && dc === 0) continue;
            this.map[nr + dr][nc + dc] = { root_r: nr, root_c: nc, val: 99 };
          }
        }
        for (let dr = 0; dr < 2; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            this.server?.emit('mapUpdate', {
              r: nr + dr,
              c: nc + dc,
              cell: this.map[nr + dr][nc + dc],
            });
          }
        }
        placed = true;
      }
      candidates.splice(idx, 1);
    }
  }
}
