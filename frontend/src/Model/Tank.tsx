export type Tank = {
    id: string;
    name: string;
    x: number, // Vị trí ban đầu X (giữa)
    y: number, // Vị trí ban đầu Y (giữa)
    degree:number // Goc quay
    inBush: string,
    lastShootTimestamp: number;
    width: number,
    height: number,
    radius: number,
    // Shield value (optional) - amount of temporary shield points
    maxHealth: number,
    health: number
    shield: number,
    speed: number,

    itemKind: string; // for pickup items (health, shield, speed, damage)
    itemExpire: number; // timestamp when item effect expires

    score: number,
    level: number,

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
    moving: {
      frameIndex: number,
      frameCounter: number,
      isMoving: boolean,
    },
    onHit: {
      frameIndex: number,
      frameCounter: number,
      isOnHit: boolean,
    }
    
    
   
  
  }
}
