import { RefObject, useCallback } from "react";
import { KeyMap } from "../Model/KeyMap";
import { Tank } from "../Model/Tank";
import { ANIMATION_SPEED } from "../GlobalSetting";
import { TankGun } from "../Model/TankGun";
import { Bullet } from "../Model/Bullet";

export const tankBulletAnimation = (
  ctx: CanvasRenderingContext2D,
  bullets: RefObject<Bullet[]>,
  frames: RefObject<HTMLImageElement[]>,
) => {
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    
    bullets.current.forEach((b) => {
        b.frameCounter++;
        if (b.frameCounter >= ANIMATION_SPEED) {
            b.frameCounter = 0;
            b.frameIndex = Math.min(b.frameIndex + 1,frames.current.length-1) ;
        }
        console.log("Bullet Draw frames : ",b.frameIndex)
        ctx.save();
    
        // Lấy góc quay (từ độ sang radian)
        const angleInRadians = b.degree * (Math.PI / 180);
    
        // 2. Di chuyển gốc tọa độ đến tâm của tank
        // Tâm X = tank.x + tank.width / 2
        // Tâm Y = tank.y + tank.height / 2
        ctx.translate(b.x, b.y);
    
        // 3. Xoay context theo góc đã tính (radian)
        ctx.rotate(angleInRadians);
    
        // Lấy đối tượng Image tương ứng với khung hình hiện tại
        const img = frames.current[b.frameIndex];
        if(!img) {
          ctx.restore()
          return 
        }
    
        // Vị trí vẽ trên Canvas (đích đến)
        const destX = - b.width / 2; // Căn giữa
        const destY = - b.height / 2; // Căn giữa
    
        // Kích thước vẽ trên Canvas
        const destWidth = b.width;
        const destHeight = b.height;
    
        ctx.drawImage(img, destX, destY, destWidth, destHeight);
        ctx.restore()
    })

  };

  updateAnimation();
};
