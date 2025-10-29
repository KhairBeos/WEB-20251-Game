import { RefObject, useCallback } from "react";
import { KeyMap } from "../Model/KeyMap";
import { Tank } from "../Model/Tank";
import { ANIMATION_SPEED } from "../GlobalSetting";

export const tankGunAnimation = (
  ctx: CanvasRenderingContext2D,
  tank: RefObject<Tank>,
  keysPressed: RefObject<KeyMap>,
  frames: RefObject<HTMLImageElement[]>
) => {
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = (isShooting: boolean) => {
    const p = tank.current;

    // Nếu nhân vật đang di chuyển, cập nhật hoạt ảnh
    if (isShooting) {
      p.frameCounter++;
      if (p.frameCounter >= ANIMATION_SPEED) {
        p.frameCounter = 0;
        // Chuyển sang khung hình tiếp theo, nếu là khung cuối thì quay lại khung đầu (0)
        p.frameIndex = (p.frameIndex + 1) % 2;
      }
    } else {
      p.frameCounter = 0;
      p.frameIndex = 0;
    }

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
    const img = frames.current[p.frameIndex];

    // Vị trí vẽ trên Canvas (đích đến)
    const destX = - p.width / 2; // Căn giữa
    const destY = - p.height / 2; // Căn giữa

    // Kích thước vẽ trên Canvas
    const destWidth = p.width;
    const destHeight = p.height;

    ctx.drawImage(img, destX, destY, destWidth, destHeight);
    ctx.restore()
  };

  const keys = keysPressed.current;
  updateAnimation(false);
};
