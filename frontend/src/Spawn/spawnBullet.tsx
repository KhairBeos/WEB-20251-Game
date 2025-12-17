// import { RefObject } from "react";
// import {
//   PLAYER_SPEED,
//   CANVAS_WIDTH,
//   CANVAS_HEIGHT,
//   TANK_ROTATE_SPEED,
//   COOLDOWN_MS,
// } from "../GlobalSetting";
// import { KeyMap } from "../Model/KeyMap";
// import { TankGun } from "../Model/TankGun";
// import { Bullet } from "../Model/Bullet";
// import { TankBullet } from "../Model/TankBullet";

// export const spawnBullet = (
//   bullets: RefObject<Bullet[]>,
//   tankGun: RefObject<TankGun>,
//   keysPressed: RefObject<KeyMap>,
// ) => {
//   const updateBullet = () => {
//     const keys = keysPressed.current;
//     const p = tankGun.current;
//     if (keys["j"]) {
//       const currentTime = Date.now();

//       // 1. Kiểm tra: Hoạt ảnh không được chạy VÀ đã qua thời gian hồi chiêu
//       if (!p.isShooting && currentTime - p.lastShoot >= COOLDOWN_MS) {
//         // 2. Kích hoạt hoạt ảnh
//         p.isShooting = true,
//           // 3. Cập nhật thời điểm bắn cuối cùng
//           p.lastShoot = currentTime;

//           // 4. SPWAN BULLET (LOGIC MỚI)
//         const bulletAngleInRadians = p.degree * (Math.PI / 180);
//         // Tính toán vị trí spawn ngay phía trước nòng súng
//         const spawnDistance = p.height / 2 + 5;

//         // Sử dụng sin/cos để tìm điểm cách tâm tank một khoảng 'spawnDistance' theo góc 'p.degree'
//         const startX = p.x + spawnDistance * Math.sin(bulletAngleInRadians);
//         const startY = p.y - spawnDistance * Math.cos(bulletAngleInRadians);

//         console.log(new TankBullet(startX,startY,p.degree))

//         const newBullet = new TankBullet(startX,startY,p.degree);
//         bullets.current.push(newBullet)
//         console.log("new Bullet spawn")
//         console.log("bullets size:",bullets.current.length)

//       }
//     }
//   };
//   updateBullet();
// };
