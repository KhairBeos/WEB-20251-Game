import { RefObject } from "react";
import { KeyMap } from "../Model/KeyMap";
import { TankState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";

export const tankGunAnimation = (
  ctx: CanvasRenderingContext2D,
   tankState: RefObject<TankState>,
  tankGunAnimationState: RefObject<TankGunAnimationState>,
  keysPressed: RefObject<KeyMap>,
  frames: RefObject<HTMLImageElement[]>
) => {
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    const tankStates = tankState.current.tankStates;
    const serverTimestamp = tankState.current.serverTimestamp;
   
    // Duyệt qua tất cả các tank trong trạng thái nhận được từ server
    for (const playerId in tankStates) {
      const p = tankStates[playerId];

      // Khởi tạo trạng thái hoạt ảnh nếu chưa có
      if (tankGunAnimationState.current[playerId] === undefined) {
        tankGunAnimationState.current[playerId] = {
          frameIndex: 0,
          frameCounter: 0,
          isFiring: false,
        };
      }

      if( keysPressed.current["j"] && p.lastShootTimestamp + 1000 < Date.now()) {
        tankGunAnimationState.current[playerId].isFiring = true;
        console.log("Set isFiring true for player ", playerId);
      }
      
      const animState = tankGunAnimationState.current[playerId];
      // Nếu nhân vật đang di chuyển, cập nhật hoạt ảnh
      if (animState.isFiring) {
        animState.frameCounter++;
        console.log(animState.frameIndex, animState.frameCounter);
        if (animState.frameCounter >= 5) {
          animState.frameCounter = 0;
          animState.frameIndex++;
          // Ket thuc hoat anh khi ve het frame
          if( animState.frameIndex === frames.current.length ){
            animState.frameIndex = 0;
            animState.isFiring = false;
          }
        }
      } else {
        animState.frameCounter = 0;
        animState.frameIndex = 0;
      }
      // console.log(p.isMoving,animState.frameIndex, animState.frameCounter);

      ctx.save();

      // Lấy góc quay (từ độ sang radian)
      const angleInRadians = p.degree * (Math.PI / 180);

      // 2. Di chuyển gốc tọa độ đến tâm của tank
      // Tâm X = tank.x + tank.width / 2
      // Tâm Y = tank.y + tank.height / 2
      ctx.translate(p.x, p.y);

      // 3. Xoay context theo góc đã tính (radian)
      ctx.rotate(angleInRadians);

      // Lấy đối tượng Image tương ứng với khung hình hiện tại
      const img = frames.current[animState.frameIndex];
      if (!img) {
        ctx.restore();
        return;
      }

      // Vị trí vẽ trên Canvas (đích đến)
      const destX = -p.width / 2; // Căn giữa
      const destY = -p.height / 2; // Căn giữa

      // Kích thước vẽ trên Canvas
      const destWidth = p.width;
      const destHeight = p.height;

      //console.log(img,destX,destY,destWidth,destHeight)
      ctx.drawImage(img, destX, destY, destWidth, destHeight);

      ctx.restore();
    }
  };

  updateAnimation();
};
