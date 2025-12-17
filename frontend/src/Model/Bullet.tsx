// export class Bullet {
//     x: number; // Vị trí ban đầu X (giữa)
//     y: number; // Vị trí ban đầu Y (giữa)
//     width: number;
//     height: number;
//     frameIndex: number = 0; // Khung hình hoạt ảnh hiện tại
//     frameCounter: number = 0;
//     degree:number // Goc quay
//   // Constructor để khởi tạo các thuộc tính cơ bản
//   constructor(x:number,y:number,width:number,height:number,degree:number) {
//     this.x = x;
//     this.y = y;
//     this.width = width,
//     this.height = height,
//     this.degree = degree
//   }
// }

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
