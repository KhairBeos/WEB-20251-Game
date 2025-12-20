import { RefObject } from "react";
import { KeyMap } from "../Model/KeyMap";
import { TankState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";
import { BUSH_SELF_ALPHA } from "../GlobalSetting";

export const tankGunAnimation = (
  ctx: CanvasRenderingContext2D,
  tankState: RefObject<TankState>,
  tankGunAnimationState: RefObject<TankGunAnimationState>,
  keysPressed: RefObject<KeyMap>,
  frames: RefObject<HTMLImageElement[]>,
  viewerId?: string,
  fireSoundRef?: RefObject<HTMLAudioElement>,
) => {
 
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    const tankStates = tankState.current.tankStates;
    const serverTimestamp = tankState.current.serverTimestamp;

     if(viewerId == null) return
    const viewerTank = tankStates[viewerId];

    // Duyệt qua tất cả các tank trong trạng thái nhận được từ server
    for (const playerId in tankStates) {
      const p = tankStates[playerId];

      // Khởi tạo trạng thái hoạt ảnh nếu chưa có
      if (tankGunAnimationState.current[playerId] === undefined) {
        tankGunAnimationState.current[playerId] = {
          frameIndex: 0,
          frameCounter: 0,
          isFiring: false,
          lastAnimationTime: 0
        };
      }
      
      const animState = tankGunAnimationState.current[playerId];
      // Nếu nhân vật đang di chuyển, cập nhật hoạt ảnh
      if (animState.isFiring) {
        // Phát âm thanh bắn
        if(fireSoundRef && fireSoundRef.current && animState.frameCounter === 0 && animState.frameIndex === 0) {
          fireSoundRef.current.play();
        }
        animState.frameCounter++;
        //console.log(animState.frameIndex, animState.frameCounter);
        if (animState.frameCounter >= 5) {
          animState.frameCounter = 0;
          animState.frameIndex++;
          // Ket thuc hoat anh khi ve het frame
          if (animState.frameIndex === frames.current.length) {
            animState.frameIndex = 0;
            animState.isFiring = false;
            animState.lastAnimationTime = Date.now();
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

      // Nếu tank của mình và đang ở trong bụi, vẽ mờ đi
      if (playerId === viewerId && p.inBush != "none") {
        ctx.globalAlpha = BUSH_SELF_ALPHA;
      }

      // Nếu không phải tank của mình và tank đó đang ở trong bụi, không vẽ lên canvas
      if (playerId !== viewerId && p.inBush != "none") {
        // Nếu cùng bụi với tank của mình, vẽ mờ đi
        if (p.inBush == viewerTank.inBush) {
          ctx.globalAlpha = BUSH_SELF_ALPHA; // Mức độ mờ cho tank khác trong bụi
        }
        else {
          ctx.restore();
          continue; // Bỏ qua việc vẽ tank này
        }
      }

      ctx.drawImage(img, destX, destY, destWidth, destHeight);
      ctx.restore();
    }
  };

  updateAnimation();
};
