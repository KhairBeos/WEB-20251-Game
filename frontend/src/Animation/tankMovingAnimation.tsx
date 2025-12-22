import { RefObject } from "react";
import { KeyMap } from "../Model/KeyMap";
import { TankAnimationState, TankState } from "../Model/Tank";
import { ANIMATION_SPEED, BUSH_SELF_ALPHA, DEBUG_MODE } from "../GlobalSetting"; // Chuyển khung hình sau mỗi X frame game (Tốc độ chuyển động: 60fps / 6 = 10 khung hình/giây)

export const tankMovingAnimation = (
  ctx: CanvasRenderingContext2D,
  tankState: RefObject<TankState>,
  tankAnimationState: RefObject<TankAnimationState>,
  keysPressed: RefObject<KeyMap>,
  frames: RefObject<HTMLImageElement[]>,
  viewerId?: string,
  hitSoundRef?: RefObject<HTMLAudioElement>,
) => {
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    // console.log(tank.current.degree)
    const tankStates = tankState.current.tankStates;
    const serverTimestamp = tankState.current.serverTimestamp;

    if(viewerId == null) return
    const viewerTank = tankStates[viewerId];
    // console.log("Viewer tank:", viewerTank);

    // Duyệt qua tất cả các tank trong trạng thái nhận được từ server
    for (const playerId in tankStates) {
      const p = tankStates[playerId];

      // Khởi tạo trạng thái hoạt ảnh nếu chưa có
      if (tankAnimationState.current[playerId] === undefined) {
        tankAnimationState.current[playerId] = {
          moving: {
            frameIndex: 0,
            frameCounter: 0,
            isMoving: false,
          },
          onHit: {
            frameIndex: 0,
            frameCounter: 0,
            isOnHit: false,
          }
        };
      }

      // Cập nhật trạng thái di chuyển dựa trên phím nhấn
      if (keysPressed.current["w"] || keysPressed.current["s"])
        tankAnimationState.current[playerId].moving.isMoving = true;
      else 
        tankAnimationState.current[playerId].moving.isMoving = false;


      const animState = tankAnimationState.current[playerId];
      // Nếu nhân vật đang di chuyển, cập nhật hoạt ảnh
      if (animState.moving.isMoving) {
        animState.moving.frameCounter++;
        if (animState.moving.frameCounter >= ANIMATION_SPEED) {
          animState.moving.frameCounter = 0;
          // Chuyển sang khung hình tiếp theo, nếu là khung cuối thì quay lại khung đầu (0)
          animState.moving.frameIndex = (animState.moving.frameIndex + 1) % 2;
        }
      } else {
        animState.moving.frameCounter = 0;
        animState.moving.frameIndex = 0;
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
      const img = frames.current[animState.moving.frameIndex];
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


      // Nếu tank đang bị trúng đạn, làm hiệu ứng nhấp nháy
      if (animState.onHit.isOnHit) {
        // Phát âm thanh trúng đạn
        if(hitSoundRef && hitSoundRef.current && animState.onHit.frameCounter === 0 && animState.onHit.frameIndex === 0) {
          hitSoundRef.current.play();
        }
        animState.onHit.frameCounter++;
        if (animState.onHit.frameCounter >= ANIMATION_SPEED) {
          animState.onHit.frameCounter = 0;
          animState.onHit.frameIndex++;
          // Kết thúc hiệu ứng khi vẽ hết tất cả khung hình
          if (animState.onHit.frameIndex >= 1) {
            animState.onHit.isOnHit = false;
            animState.onHit.frameIndex = 0;
            animState.onHit.frameCounter = 0;
          }
        }
        // Bôi đỏ tank khi trúng đạn
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.fillRect(destX, destY, destWidth, destHeight);
        
        // Vẽ tank
        // ctx.drawImage(img, destX, destY, destWidth, destHeight);
        ctx.restore();
        continue;
      }

      // Nếu tank của mình và đang ở trong bụi, vẽ mờ đi
      if (playerId === viewerId && p.inBush != "none") {
        ctx.globalAlpha = BUSH_SELF_ALPHA;
      }
      
      // Nếu không phải tank của mình và tank đó đang ở trong bụi,
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

      // console.log("Drawing tank", playerId, "at", p.x, p.y, "inBush:", p.inBush);
      
      // Debug: Hiển thị bounding box tank và bán kính va chạm
      if (DEBUG_MODE) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(destX, destY, destWidth, destHeight);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    
      ctx.restore();
    }
  };
  updateAnimation();
};
