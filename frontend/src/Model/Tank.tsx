export type Tank = {
    x: number, // Vị trí ban đầu X (giữa)
    y: number, // Vị trí ban đầu Y (giữa)
    degree:number // Goc quay
    health: number
    lastShootTimestamp: number;
    width: number,
    height: number,
    radius: number,
  maxHealth: number,
  // Shield value (optional) - amount of temporary shield points
  shield?: number,
  shieldUntil?: number, // shield expiration timestamp
  lastHealthPickupTime?: number, // timestamp when health pickup consumed
    inBush: string,
}

export type TankInput = {
    direction: 'forward' | 'backward' | 'none',
    rotate: 'left' | 'right' | 'none',
    clientTimestamp: number,
    isFire: boolean;
}


export interface TankState {
  serverTimestamp: number;
  tankStates: {
    [playerId: string]: Tank;
  };
}

export interface TankAnimationState {
  [playerId: string]: {
    frameIndex: number,
    frameCounter: number,
    isMoving: boolean,
    // last seen values to detect changes from server for transient indicators
    lastSeen?: {
      health?: number;
      lastHealthPickupTime?: number;
      shield?: number;
      shieldUntil?: number;
      speedBoostUntil?: number;
      damageBoostUntil?: number;
    };
    // buff indicator expirations (ms since epoch)
    buffExp?: {
      health?: number;
      shield?: number;
      speed?: number;
      damage?: number;
    };
    // metadata for buff durations (ms total at start)
    buffMeta?: {
      health?: number;
      shield?: number;
      speed?: number;
      damage?: number;
    };
  }
}
