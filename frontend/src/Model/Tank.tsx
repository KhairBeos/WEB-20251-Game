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
        isMoving: boolean
        
    }
}
