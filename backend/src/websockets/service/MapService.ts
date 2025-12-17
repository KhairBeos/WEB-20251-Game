import { MapCell, MAP_ROWS, MAP_COLS } from '../model/MapData';

export class MapService {
  constructor(private readonly map: MapCell[][]) {}

  getRoot(r: number, c: number) {
    if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) return undefined;
    const tile = this.map[r][c];
    const rootR = tile.val === 99 ? tile.root_r : r;
    const rootC = tile.val === 99 ? tile.root_c : c;
    if (rootR < 0 || rootR >= MAP_ROWS || rootC < 0 || rootC >= MAP_COLS) return undefined;
    const root = this.map[rootR][rootC];
    return { r: rootR, c: rootC, val: root.val };
  }

  isBush(val: number) {
    return val >= 11 && val <= 14;
  }
  isTree(val: number) {
    return val === 10;
  }
  isTower(val: number) {
    return val >= 1 && val <= 4;
  }
}
