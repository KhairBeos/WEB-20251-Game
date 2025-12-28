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
  shield: number; // shield HP that absorbs bullet damage first
  itemKind: string; // for pickup items (health, shield, speed, damage)
  itemExpire: number; // timestamp when item effect expires
  score: number;
  level: number;
  xp: number;
  skin: string;
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

export function createInitialTank(id: string, name: string, skin: string): Tank {
  const mapWidth = MAP_COLS * TILE_SIZE;
  const mapHeight = MAP_ROWS * TILE_SIZE;

  // create random spawn point
  var x = Math.floor(Math.random() * mapWidth);
  var y = Math.floor(Math.random() * mapHeight);
  x = Math.max(x, 200);
  y = Math.max(y, 200);
  x = Math.min(x, mapWidth - 200);
  y = Math.min(y, mapHeight - 200);

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
    xp: 0,
    skin: skin,
  };
}

// next xp = old exp * 1.1
export const levelUpScores = {
  1: 0,
  2: 10,
  3: 11,
  4: 12,
  5: 14,
  6: 16,
  7: 18,
  8: 20,
  9: 23,
  10: 25,
  11: 28,
  12: 31,
  13: 34,
  14: 38,
  15: 41,
  16: 45,
  17: 49,
  18: 54,
  19: 59,
  20: 64,
  21: 70,
  22: 76,
  23: 83,
  24: 90,
  25: 97,
  26: 105,
  27: 113,
  28: 121,
  29: 130,
  30: 139,
  31: 149,
  32: 159,
  33: 170,
  34: 181,
  35: 193,
  36: 205,
  37: 218,
  38: 232,
  39: 246,
  40: 261,
  41: 276,
  42: 292,
  43: 309,
  44: 326,
  45: 344,
  46: 362,
  47: 381,
  48: 401,
  49: 421,
  50: 442,
  51: 464,
  52: 486,
};
