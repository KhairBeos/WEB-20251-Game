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
    while (safety++ < 1000) {
      const r = Math.floor(Math.random() * MAP_ROWS);
      const c = Math.floor(Math.random() * MAP_COLS);

      // Tránh mép
      if (r < 3 || r > MAP_ROWS - 4 || c < 3 || c > MAP_COLS - 4) continue;

      // Tránh vùng spawn (6 tile xung quanh spawn point)
      let nearSpawn = false;
      for (const sp of SPAWNPOINTS) {
        if (Math.abs(sp.r - r) * TILE_SIZE <= 240 && Math.abs(sp.c - c) * TILE_SIZE <= 240) {
          nearSpawn = true;
          break;
        }
      }
      if (nearSpawn) continue;

      if (this.mapData.map[r][c].val !== 0) continue;

      const type = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
      this.mapData.map[r][c] = { root_r: -1, root_c: -1, val: type };
      this.server?.emit('mapUpdate', { r, c, cell: this.mapData.map[r][c] });
      this.mapData.itemNumber++;
      return true;
    }
    return false;
  }
}
