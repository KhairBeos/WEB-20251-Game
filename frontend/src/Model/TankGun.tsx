export type TankGun = {
    x: number, // Vị trí ban đầu X (giữa)
    y: number, // Vị trí ban đầu Y (giữa)
    width: number,
    height: number,
    frameIndex: number, // Khung hình hoạt ảnh hiện tại
    frameCounter: number, 
    degree:number // Goc quay
    isShooting: boolean,
    lastShoot: number,
}

// interface PlayerState {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   frameIndex: number;
//   frameCounter: number;
// }