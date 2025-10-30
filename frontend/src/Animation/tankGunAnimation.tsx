import { RefObject, useCallback } from "react";
import { KeyMap } from "../Model/KeyMap";
import { Tank } from "../Model/Tank";
import { ANIMATION_SPEED } from "../GlobalSetting";
import { TankGun } from "../Model/TankGun";

export const tankGunAnimation = (
  ctx: CanvasRenderingContext2D,
  tank: RefObject<TankGun>,
  keysPressed: RefObject<KeyMap>,
  frames: RefObject<HTMLImageElement[]>,
) => {
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    const p = tank.current;
    const keys = keysPressed.current;
    if(keys["j"] && !p.isShooting) {
      console.log("Start Shotting")
      p.isShooting = true, p.lastShoot = Date.now() 
    }

    // Nếu nhân vật đang di chuyển, cập nhật hoạt ảnh
    if (p.isShooting) {
      p.frameCounter++;
      if (p.frameCounter >= ANIMATION_SPEED) {
        p.frameCounter = 0;
        // Chuyển sang khung hình tiếp theo, nếu là khung cuối thì quay lại khung đầu (0)
        //console.log(p.frameIndex, frames.current.length-1, p.frameIndex == frames.current.length-1)
       

        
        if(p.frameIndex == frames.current.length-1) {
          p.isShooting = false
          console.log("Stop shotting")
        }
        p.frameIndex = (p.frameIndex + 1) % frames.current.length;
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
    if(!img) {
      ctx.restore()
      return 
    }

    // Vị trí vẽ trên Canvas (đích đến)
    const destX = - p.width / 2; // Căn giữa
    const destY = - p.height / 2; // Căn giữa

    // Kích thước vẽ trên Canvas
    const destWidth = p.width;
    const destHeight = p.height;

    ctx.drawImage(img, destX, destY, destWidth, destHeight);
    ctx.restore()
  };

  updateAnimation();
};
