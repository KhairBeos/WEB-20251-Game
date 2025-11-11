// import { RefObject } from "react";
// import {
//   PLAYER_SPEED,
//   CANVAS_WIDTH,
//   CANVAS_HEIGHT,
//   TANK_ROTATE_SPEED,
//   BULLET_SPEED,
// } from "../GlobalSetting";
// import { KeyMap } from "../Model/KeyMap";
// import { Tank } from "../Model/Tank";
// import { TankGun } from "../Model/TankGun";
// import { Bullet } from "../Model/Bullet";
// import { TankBullet } from "../Model/TankBullet";

// export const bulletUpdatePosistion = (
//   bullets : RefObject<Bullet[]>,
//   keysPressed: RefObject<KeyMap>
// ) => {
//   const updatePosition = () => {

//     bullets.current = bullets.current.map((bullet) => {
//         const angleRad = bullet.degree * (Math.PI / 180);

//         // Tính toán thay đổi vị trí dựa trên góc và tốc độ
//         // Math.sin cho trục X, Math.cos cho trục Y (Lưu ý: Y âm để đi lên)
//         bullet.x += BULLET_SPEED * Math.sin(angleRad);
//         bullet.y -= BULLET_SPEED * Math.cos(angleRad); 

//         console.log(bullet.x,bullet.y)
//         return bullet

//     }).filter(bullet => {
//       // Giữ lại đạn nếu nó còn trong phạm vi Canvas va ton tai < 3000ms
//       if(bullet instanceof TankBullet) {
//           if(bullet.x > 0 && 
//                   bullet.x < CANVAS_WIDTH &&
//                   bullet.y > 0 && 
//                   bullet.y < CANVAS_HEIGHT 
//                   && Date.now() - bullet.timeSpawn <= 3000){
//                       console.log("Bullet deo xoa")
//                       return true
//                   }
//           else {
//             console.log("Bullet xoa")
//             return false;
//           }
//       }
//       else return false;
//     })

//   };
//   updatePosition();
// };
