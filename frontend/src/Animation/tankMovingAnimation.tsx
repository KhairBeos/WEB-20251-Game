import { RefObject, useCallback } from "react";
import { KeyMap } from "../Model/KeyMap";
import { Tank, TankAnimationState, TankState } from "../Model/Tank";
import { CANVAS_WIDTH, CANVAS_HEIGHT, ANIMATION_SPEED } from "../GlobalSetting"; // Chuyển khung hình sau mỗi X frame game (Tốc độ chuyển động: 60fps / 6 = 10 khung hình/giây)

export const tankMovingAnimation = (
  ctx: CanvasRenderingContext2D,
  tankState: RefObject<TankState>,
  tankAnimationState: RefObject<TankAnimationState>,
  keysPressed: RefObject<KeyMap>,
  frames: RefObject<HTMLImageElement[]>
) => {
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    // console.log(tank.current.degree)
    const tankStates = tankState.current.tankStates;
    const serverTimestamp = tankState.current.serverTimestamp;

    // Duyệt qua tất cả các tank trong trạng thái nhận được từ server
    for (const playerId in tankStates) {
      const p = tankStates[playerId];

      // Khởi tạo trạng thái hoạt ảnh nếu chưa có
      if (tankAnimationState.current[playerId] === undefined) {
        tankAnimationState.current[playerId] = {
          frameIndex: 0,
          frameCounter: 0,
          isMoving: false,
        };
      }

      // Cập nhật trạng thái di chuyển dựa trên phím nhấn
      if (keysPressed.current["w"] || keysPressed.current["s"])
        tankAnimationState.current[playerId].isMoving = true;
      else 
        tankAnimationState.current[playerId].isMoving = false;


      const animState = tankAnimationState.current[playerId];
      // Nếu nhân vật đang di chuyển, cập nhật hoạt ảnh
      if (animState.isMoving) {
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

      // vẽ viền hộp tank
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(destX, destY, destWidth, destHeight);

      // vẽ hình tròn quanh tank
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.stroke();
    

      ctx.restore();
    }
  };
  updateAnimation();
};
