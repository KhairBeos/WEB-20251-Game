interface BulletInput {
  // Define bullet input properties if needed
  startX: number;
  startY: number;
  degree: number;
}

export interface Bullet {
  x: number;
  y: number;
  degree: number;
  speed: number;
  width: number;
  height: number;
  damage: number;
  ownerId: string;
}

export interface BulletState {
  serverTimestamp: number;
  bulletStates: {
      // Key là bulletId (ID duy nhất của viên đạn)
      [bulletId: string]: Bullet;
  };
}

export interface BulletAnimationState {
    [bulletId: string]: {
      frameIndex: number;
      frameCounter: number;
    };
  
}
