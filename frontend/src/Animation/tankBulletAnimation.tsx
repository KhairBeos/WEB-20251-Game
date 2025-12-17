import { RefObject } from "react";
import { ANIMATION_SPEED } from "../GlobalSetting";
import { BulletAnimationState, BulletState } from "../Model/Bullet";

export const tankBulletAnimation = (
  ctx: CanvasRenderingContext2D,
  bulletState: RefObject<BulletState>,
  bulletAnimationState: RefObject<BulletAnimationState>,
  frames: RefObject<HTMLImageElement[]>
) => {
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    const bulletStates = bulletState.current.bulletStates;
    const serverTimestamp = bulletState.current.serverTimestamp;

    // Duyệt qua tất cả các đạn trong trạng thái nhận được từ server
    for(const bid in bulletStates) {
      const bullet = bulletStates[bid];
      const playerId = bullet.ownerId;
      // Khởi tạo trạng thái hoạt ảnh bullet nếu chưa có
      if (bulletAnimationState.current[bid] === undefined) {
        bulletAnimationState.current[bid] = {
          frameIndex: 0,
          frameCounter: 0,
        };
      }
      
        // Cập nhật hoạt ảnh đạn
        const animState = bulletAnimationState.current[bid];
        animState.frameCounter++;
        if (animState.frameCounter >= ANIMATION_SPEED) {
          animState.frameCounter = 0;
          // Chuyển sang khung hình tiếp theo, nếu là khung cuối thì quay lại khung đầu (0)
          animState.frameIndex =
            (animState.frameIndex + 1) % frames.current.length;
        }

        // Vẽ đạn lên Canvas
        ctx.save();

        // 1. Dịch chuyển context đến vị trí đạn
        ctx.translate(bullet.x, bullet.y);

        // 3. Xoay context theo góc đã tính (radian)
        const angleInRadians = bullet.degree * (Math.PI / 180);
        ctx.rotate(angleInRadians);

        // Lấy đối tượng Image tương ứng với khung hình hiện tại
        const img = frames.current[animState.frameIndex];
        if (!img) {
          ctx.restore();
          return;
        }

        // Vị trí vẽ trên Canvas (đích đến)
        const destX = -bullet.width / 2; // Căn giữa
        const destY = -bullet.height / 2; // Căn giữa

        // Kích thước vẽ trên Canvas
        const destWidth = bullet.width;
        const destHeight = bullet.height;

        ctx.drawImage(img, destX, destY, destWidth, destHeight);
        ctx.restore();
      }
    }
  

  updateAnimation();
};
