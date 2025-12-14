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
