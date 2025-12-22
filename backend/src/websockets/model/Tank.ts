import { MAP_COLS, MAP_ROWS, TILE_SIZE } from "./MapData";

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

export function createInitialTank(id: string, name: string): Tank {
  const mapWidth = MAP_COLS * TILE_SIZE;
  const mapHeight = MAP_ROWS * TILE_SIZE;

  // create random spawn point
  var x = Math.floor(Math.random() * mapWidth);
  var y = Math.floor(Math.random() * mapHeight);
  x = Math.max(x, 200)
  y = Math.max(y, 200)
  x = Math.min(x, mapWidth - 200)
  y = Math.min(y, mapHeight - 200)
  
  
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