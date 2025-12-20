import { RefObject } from "react";
import { KeyMap } from "../Model/KeyMap";
import { TankState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";

export const tankGunAnimation = (
  ctx: CanvasRenderingContext2D,
  tankState: RefObject<TankState>,
  tankGunAnimationState: RefObject<TankGunAnimationState>,
  keysPressed: RefObject<KeyMap>,
  frames: RefObject<HTMLImageElement[]>,
  skinGunFrames?: RefObject<Record<string, HTMLImageElement[]>>,
) => {
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    const tankStates = tankState.current.tankStates;

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

      if (tankGunAnimationState.current[playerId].isFiring
        && tankGunAnimationState.current[playerId].lastAnimationTime > p.lastShootTimestamp
        && p.lastShootTimestamp + 1000 > Date.now()) {
        tankGunAnimationState.current[playerId].isFiring = false;
      }

      const animState = tankGunAnimationState.current[playerId];
      // Nếu nhân vật đang di chuyển, cập nhật hoạt ảnh
      if (animState.isFiring) {
        animState.frameCounter++;
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

      ctx.save();

      // Lấy góc quay (từ độ sang radian)
      const angleInRadians = p.degree * (Math.PI / 180);

      // Di chuyển gốc tọa độ đến tâm của tank
      ctx.translate(p.x, p.y);

      // Xoay context theo góc đã tính (radian)
      ctx.rotate(angleInRadians);

      // Chọn gun frames theo skin của tank
      const skinId = p.skin || "scarlet";
      const gunFramesForSkin = skinGunFrames?.current?.[skinId];
      const gunFrames = gunFramesForSkin && gunFramesForSkin.length > 0
        ? gunFramesForSkin
        : frames.current;

      const img = gunFrames[animState.frameIndex];
      if (!img) {
        ctx.restore();
        continue;
      }

      // Vị trí vẽ trên Canvas (đích đến)
      const destX = -p.width / 2; // Căn giữa
      const destY = -p.height / 2; // Căn giữa

      // Kích thước vẽ trên Canvas
      const destWidth = p.width;
      const destHeight = p.height;

      ctx.drawImage(img, destX, destY, destWidth, destHeight);

      ctx.restore();
    }
  };

  updateAnimation();
};
