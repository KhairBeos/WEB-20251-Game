import { MapCell } from '../model/MapData';

export class TowerService {
  constructor(
    private map: MapCell[][],
    private server: any,
  ) {}

  // Tower bị phá hủy: 10% rơi pickup, respawn sau 30s
  onTowerDestroyed(rootR: number, rootC: number, onDropPickup?: (r: number, c: number) => void) {
    // 10% rơi pickup
    if (Math.random() < 0.1) {
      const pickupTypes = [101, 102, 103, 104];
      const type = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
      // cố gắng đặt pickup vào một trong 4 ô của 2x2
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
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
    // Hẹn giờ respawn tower về full (4)
    setTimeout(() => {
      // đặt lại 2x2 tower
      const canPlace =
        rootR >= 0 &&
        rootR + 1 < this.map.length &&
        rootC >= 0 &&
        rootC + 1 < this.map[0].length &&
        this.map[rootR][rootC].val === 0 &&
        this.map[rootR][rootC + 1].val === 0 &&
        this.map[rootR + 1][rootC].val === 0 &&
        this.map[rootR + 1][rootC + 1].val === 0;
      if (canPlace) {
        this.map[rootR][rootC] = { root_r: rootR, root_c: rootC, val: 4 };
        this.map[rootR][rootC + 1] = { root_r: rootR, root_c: rootC, val: 99 };
        this.map[rootR + 1][rootC] = { root_r: rootR, root_c: rootC, val: 99 };
        this.map[rootR + 1][rootC + 1] = { root_r: rootR, root_c: rootC, val: 99 };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        this.server.emit('mapUpdate', {
          r: rootR,
          c: rootC,
          cell: this.map[rootR][rootC],
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        this.server.emit('mapUpdate', {
          r: rootR,
          c: rootC + 1,
          cell: this.map[rootR][rootC + 1],
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        this.server.emit('mapUpdate', {
          r: rootR + 1,
          c: rootC,
          cell: this.map[rootR + 1][rootC],
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        this.server.emit('mapUpdate', {
          r: rootR + 1,
          c: rootC + 1,
          cell: this.map[rootR + 1][rootC + 1],
        });
      }
    }, 30000); // 30s
  }
}
