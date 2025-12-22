export interface Bullet {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  degree: number;
  speed: number;
  damage: number;
  ownerId: string;
  lastTimeFired: number;
}
export interface BulletInput {
  clientTimestamp: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
  degree: number;
  speed: number;
  damage: number;
  ownerId: string;
}

export interface BulletState {
  serverTimestamp: number;
  bulletStates: { [bulletId: string]: Bullet };
}

export interface BulletInputBuffer {
  [playerId: string]: BulletInput[];
}
