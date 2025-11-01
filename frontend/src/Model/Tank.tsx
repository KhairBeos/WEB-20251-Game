export type Tank = {
    x: number, // Vị trí ban đầu X (giữa)
    y: number, // Vị trí ban đầu Y (giữa)
    width: number,
    height: number,
    frameIndex: number, // Khung hình hoạt ảnh hiện tại
    frameCounter: number, 
    degree:number // Goc quay
}

export type TankState = {
    x: number, // Vị trí ban đầu X (giữa)
    y: number, // Vị trí ban đầu Y (giữa)
    degree:number // Goc quay
    health: number
    isMoving: boolean
    isFireing: boolean
    width: number,
    height: number,
}

export type TankInput = {
    direction: 'forward' | 'backward' | 'none',
    rotate: 'left' | 'right' | 'none',
    clientTimestamp: number,
}


export interface GameState {
  [playerId: string]: TankState;
}

export interface TankAnimationState {
    [playerId: string]: {
        frameIndex: number,
        frameCounter: number
    }
}


// interface PlayerState {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   frameIndex: number;
//   frameCounter: number;
// }