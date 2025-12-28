/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { MAP_ROWS, MAP_COLS, MapData, SPAWNPOINTS, TILE_SIZE } from '../model/MapData';

export class PickupService {
  private readonly MAX_ITEMS = 50;

  constructor(
    private mapData: MapData,
    private server: any,
  ) {}

  // Spawn ngẫu nhiên 1 pickup ở ô trống, tránh mép và vùng spawn
  spawnRandomPickup(): boolean {
    const pickupTypes = [101, 102, 103, 104];
    // Không spawn nếu đã đủ tối đa
    if (this.mapData.itemNumber >= this.MAX_ITEMS) return false;

    let safety = 0;
    while (safety++ < 500) {
      if (this.mapData.itemNumber >= 50) break; // giới hạn số lượng item trên map
      const r = Math.floor(Math.random() * MAP_ROWS);
      const c = Math.floor(Math.random() * MAP_COLS);
      if (r < 3 || r > MAP_ROWS - 4 || c < 3 || c > MAP_COLS - 4) continue;
      if (this.mapData.map[r][c].val !== 0) continue;

      const type = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
      this.mapData.map[r][c] = { root_r: -1, root_c: -1, val: type };
      this.server?.emit('mapUpdate', { r, c, cell: this.mapData.map[r][c] });
      this.mapData.itemNumber++;
      return true;
    }
    return false;
  }

  // // Pickup bị lấy: xóa khỏi map và schedule respawn
  // consumePickup(r: number, c: number, onRespawn?: () => void) {
  //   this.map[r][c] = { root_r: -1, root_c: -1, val: 0 };
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  //   this.server.emit('mapUpdate', { r, c, cell: this.map[r][c] });
  //   // respawn sau 15s
  //   setTimeout(() => {
  //     this.spawnRandomPickup();
  //     onRespawn?.();
  //   }, 15000);
  // }

  // // Kiểm tra và áp dụng pickup cho tất cả tank (dựa trên vùng bán kính)
  // processPickups(tankStates: Record<string, Tank>) {
  //   for (const pid in tankStates) {
  //     const t = tankStates[pid];
  //     const minRow = Math.max(0, Math.floor((t.y - t.radius) / TILE_SIZE));
  //     const maxRow = Math.min(this.map.length - 1, Math.floor((t.y + t.radius) / TILE_SIZE));
  //     const minCol = Math.max(0, Math.floor((t.x - t.radius) / TILE_SIZE));
  //     const maxCol = Math.min(this.map[0].length - 1, Math.floor((t.x + t.radius) / TILE_SIZE));

  //     let collected = false;
  //     for (let r = minRow; r <= maxRow && !collected; r++) {
  //       for (let c = minCol; c <= maxCol; c++) {
  //         const cell = this.map[r][c];
  //         const rootR = cell.val === 99 ? cell.root_r : r;
  //         const rootC = cell.val === 99 ? cell.root_c : c;
  //         if (rootR < 0 || rootR >= this.map.length || rootC < 0 || rootC >= this.map[0].length) {
  //           continue;
  //         }
  //         const root = this.map[rootR][rootC];
  //         switch (root.val) {
  //           case 101: // health
  //             t.health = Math.min(t.maxHealth, t.maxHealth); // full heal
  //             t.lastHealthPickupTime = Date.now(); // mark pickup for UI indicator
  //             this.consumePickup(rootR, rootC);
  //             collected = true;
  //             break;
  //           case 102: // shield
  //             t.shield = (t.shield || 0) + 100;
  //             t.shieldUntil = Date.now() + 5000; // 5s shield duration
  //             this.consumePickup(rootR, rootC);
  //             collected = true;
  //             break;
  //           case 103: // speed boost
  //             t.speedMultiplier = 1.6;
  //             t.speedBoostUntil = Date.now() + 10000; // 10s
  //             this.consumePickup(rootR, rootC);
  //             collected = true;
  //             break;
  //           case 104: // damage boost
  //             t.damageMultiplier = 2.0;
  //             t.damageBoostUntil = Date.now() + 10000;
  //             this.consumePickup(rootR, rootC);
  //             collected = true;
  //             break;
  //         }
  //         if (collected) break;
  //       }
  //     }
  //   }
  // }
}
