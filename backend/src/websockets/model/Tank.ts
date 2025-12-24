import { MAP_COLS, MAP_ROWS, TILE_SIZE, SPAWNPOINTS, MapCell } from './MapData';

export interface Tank {
  name: string;
  id: string;
  x: number;
  y: number;
  degree: number;
  health: number;
  width: number;
  height: number;
  maxHealth: number;
  radius: number;
  lastShootTimestamp: number;
  inBush: string;
  speed: number;
  damage: number;
  shield: number;
  itemKind: string;
  itemExpire: number;
  score: number;
  level: number;
}

export interface TankInput {
  clientTimestamp: number;
  rotate: 'left' | 'right' | 'none';
  direction: 'forward' | 'backward' | 'none';
  isFire: boolean;
}
export interface TankState {
  serverTimestamp: number;
  tankStates: { [playerId: string]: Tank };
}

export interface TankInputBuffer {
  [playerId: string]: TankInput[];
}

export function createInitialTank(id: string, name: string, map?: MapCell[][]): Tank {
  const mapWidth = MAP_COLS * TILE_SIZE;
  const mapHeight = MAP_ROWS * TILE_SIZE;

  // Helper: check nếu vùng quanh (x,y) trống vật cản cứng
  const isSpotFree = (px: number, py: number, radius: number) => {
    if (!map || !map.length) return true;
    const leftCol = Math.floor((px - radius) / TILE_SIZE);
    const rightCol = Math.floor((px + radius) / TILE_SIZE);
    const topRow = Math.floor((py - radius) / TILE_SIZE);
    const bottomRow = Math.floor((py + radius) / TILE_SIZE);
    for (let r = topRow; r <= bottomRow; r++) {
      for (let c = leftCol; c <= rightCol; c++) {
        if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) return false;
        const cell = map[r][c];
        const rootR = cell.val === 99 ? cell.root_r : r;
        const rootC = cell.val === 99 ? cell.root_c : c;
        const root = map[rootR][rootC];
        const val = root.val;
        const isPassable =
          val === 0 || val === 9 || (val >= 11 && val <= 14) || (val >= 101 && val <= 104);
        if (!isPassable) return false;
      }
    }
    return true;
  };

  // Ưu tiên spawn trong vùng SPAWNPOINTS (đã được dọn trống)
  const spawnTiles: Array<{ r: number; c: number }> = [];
  for (const sp of SPAWNPOINTS) {
    for (let dr = 0; dr < 5; dr++) {
      for (let dc = 0; dc < 5; dc++) {
        spawnTiles.push({ r: sp.r + dr, c: sp.c + dc });
      }
    }
  }

  let x = 0;
  let y = 0;
  const radius = 86 / 2;
  let placed = false;

  // Thử tối đa 200 lần để tìm vị trí trống trong vùng spawn
  for (let attempt = 0; attempt < 200 && !placed; attempt++) {
    const tile = spawnTiles[Math.floor(Math.random() * spawnTiles.length)];
    const px = tile.c * TILE_SIZE + TILE_SIZE / 2;
    const py = tile.r * TILE_SIZE + TILE_SIZE / 2;
    if (isSpotFree(px, py, radius)) {
      x = px;
      y = py;
      placed = true;
    }
  }

  // Nếu vẫn chưa đặt được, fallback chọn ngẫu nhiên nhưng tránh biên và vật cản cứng
  if (!placed) {
    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const px = Math.max(200, Math.min(mapWidth - 200, Math.random() * mapWidth));
      const py = Math.max(200, Math.min(mapHeight - 200, Math.random() * mapHeight));
      if (isSpotFree(px, py, radius)) {
        x = px;
        y = py;
        placed = true;
      }
    }
  }

  // Nếu vẫn không tìm được chỗ (trường hợp cực hiếm), đặt giữa bản đồ
  if (!placed) {
    x = mapWidth / 2;
    y = mapHeight / 2;
  }

  return {
    id: id,
    name: name,
    level: 1,
    score: 0,
    speed: 2,
    damage: 10,
    x: x,
    y: y,
    degree: Math.floor(Math.random() * 360),
    health: 100,
    maxHealth: 100,
    width: 66,
    height: 86,
    radius: 86 / 2,
    lastShootTimestamp: 0,
    inBush: 'none',
    itemKind: 'none',
    itemExpire: 0,
    shield: 0,
  };
}
