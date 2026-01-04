import { MapCell, MAP_COLS, MAP_ROWS, SPAWNPOINTS } from '../model/MapData';

export class TowerService {
  constructor(
    private map: MapCell[][],
    private server: any,
  ) {}

  private canPlaceTower(r: number, c: number): boolean {
    if (r < 0 || r + 1 >= MAP_ROWS || c < 0 || c + 1 >= MAP_COLS) return false;
    return (
      this.map[r][c].val === 0 &&
      this.map[r][c + 1].val === 0 &&
      this.map[r + 1][c].val === 0 &&
      this.map[r + 1][c + 1].val === 0
    );
  }

  private pickRandomLocation(): { r: number; c: number } | null {
    const maxAttempts = 300;
    for (let i = 0; i < maxAttempts; i++) {
      const r = Math.floor(Math.random() * (MAP_ROWS - 1));
      const c = Math.floor(Math.random() * (MAP_COLS - 1));
      if (this.canPlaceTower(r, c)) return { r, c };
    }
    return null;
  }

  private placeTower(r: number, c: number) {
    this.map[r][c] = { root_r: r, root_c: c, val: 4 };
    this.map[r][c + 1] = { root_r: r, root_c: c, val: 99 };
    this.map[r + 1][c] = { root_r: r, root_c: c, val: 99 };
    this.map[r + 1][c + 1] = { root_r: r, root_c: c, val: 99 };

    this.server.emit('mapUpdate', {
      r,
      c,
      cell: this.map[r][c],
    });

    this.server.emit('mapUpdate', {
      r,
      c: c + 1,
      cell: this.map[r][c + 1],
    });

    this.server.emit('mapUpdate', {
      r: r + 1,
      c,
      cell: this.map[r + 1][c],
    });

    this.server.emit('mapUpdate', {
      r: r + 1,
      c: c + 1,
      cell: this.map[r + 1][c + 1],
    });
  }

  // Tower bị phá hủy: 10% rơi pickup, respawn sau 30s
  onTowerDestroyed(rootR: number, rootC: number, onDropPickup?: (r: number, c: number) => void) {
    console.log(`Tower at (${rootR}, ${rootC}) destroyed.`);
    // console.log('grid length:', this.map.length);
// console.log('rootR:', rootR, 'rootC:', rootC);
// console.log('row:', this.map[rootR]);
    // 10% rơi pickup
    if (Math.random() < 0.1) {
      const pickupTypes = [101, 102, 103, 104];
      const type = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
      // đặt pickup vào một trong 4 ô của 2x2
      const cells = [
        { r: rootR, c: rootC },
        { r: rootR, c: rootC + 1 },
        { r: rootR + 1, c: rootC },
        { r: rootR + 1, c: rootC + 1 },
      ];
      for (const pos of cells) {
        if (
          pos.r >= 0 &&
          pos.r < this.map.length &&
          pos.c >= 0 &&
          pos.c < this.map[0].length &&
          this.map[pos.r][pos.c].val === 0
        ) {
          this.map[pos.r][pos.c] = { root_r: -1, root_c: -1, val: type };
          this.server.emit('mapUpdate', {
            r: pos.r,
            c: pos.c,
            cell: this.map[pos.r][pos.c],
          });
          onDropPickup?.(pos.r, pos.c);
          break;
        }
      }
    }

    // Ngẫu nhiên thời gian (10-30s) để respawn tower
    const timeToSpawn = 10000 + Math.random() * 20000;
    console.log(`Tower will respawn in ${timeToSpawn / 1000}s`);

    // Hẹn giờ respawn tower về full (4)
    setTimeout(() => {
      const newPos = this.pickRandomLocation();
      if (newPos) {
        console.log(`Respawning tower at (${newPos.r}, ${newPos.c})`);
        this.placeTower(newPos.r, newPos.c);
        return;
      }
      // fallback: try the old spot if still free
      if (this.canPlaceTower(rootR, rootC)) this.placeTower(rootR, rootC);
    }, 30000); // 30s
  }
}
