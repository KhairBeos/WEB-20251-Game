import { RefObject, useCallback } from "react";
import { KeyMap } from "../Model/KeyMap";
import { GameState, Tank, TankAnimationState } from "../Model/Tank";
const PLAYER_SPEED = 5;
const CANVAS_WIDTH = screen.width;
const CANVAS_HEIGHT = screen.height;
const ANIMATION_SPEED = 10; // Chuyển khung hình sau mỗi X frame game (Tốc độ chuyển động: 60fps / 6 = 10 khung hình/giây)

export const tankMovingAnimation = (
  ctx: CanvasRenderingContext2D,
  gameState: RefObject<GameState>,
  tankAnimationState: RefObject<TankAnimationState>,
  frames: RefObject<HTMLImageElement[]>
) => {
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    // console.log(tank.current.degree)
    for (const playerId in gameState.current){
      const p = gameState.current[playerId];
      

      // Khởi tạo trạng thái hoạt ảnh nếu chưa có
      if(tankAnimationState.current[playerId] === undefined){
        tankAnimationState.current[playerId] = {
            frameIndex: 0,
            frameCounter: 0
        }
      }

      const animState = tankAnimationState.current[playerId];

      // Nếu nhân vật đang di chuyển, cập nhật hoạt ảnh
      if (p.isMoving) {
        animState.frameCounter++;
        if (animState.frameCounter >= ANIMATION_SPEED) {
          animState.frameCounter = 0;
          // Chuyển sang khung hình tiếp theo, nếu là khung cuối thì quay lại khung đầu (0)
          animState.frameIndex = (animState.frameIndex + 1) % 2;
        }
      } else {
        animState.frameCounter = 0;
        animState.frameIndex = 0;
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
    };
  };
  updateAnimation();
};
