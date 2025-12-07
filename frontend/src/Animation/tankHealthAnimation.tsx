import { RefObject } from "react";
import { KeyMap } from "../Model/KeyMap";
import { TankState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";
import { BUSH_SELF_ALPHA } from "../GlobalSetting";


export const tankHealthAnimation = (
  ctx: CanvasRenderingContext2D,
   tankState: RefObject<TankState>,
   viewerId?: string,
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
      ctx.save();
      // 2. Di chuyển gốc tọa độ đến tâm của tank
      // Tâm X = tank.x + tank.width / 2
      // Tâm Y = tank.y + tank.height / 2
      ctx.translate(p.x, p.y);
        // Nếu không phải tank của mình và tank đó đang ở trong bụi, không vẽ lên canvas
        if (playerId !== viewerId && p.inBush != "none") {
          // Nếu cùng bụi với tank của mình, vẽ mờ đi
          if (p.inBush == viewerTank.inBush) {
            
          }
          else {
            ctx.restore();
            continue; // Bỏ qua việc vẽ tank này
          }
        }

        // Vẽ thanh máu dưới tank
        const healthBarWidth = 50;
        const healthBarHeight = 6;
        const healthPercentage = p.health / p.maxHealth;
        const healthBarX = -healthBarWidth / 2;
        const healthBarY = p.height / 2 +25;
        // Vẽ nền thanh máu (màu đỏ)
        ctx.fillStyle = "red";
        ctx.fillRect(
            healthBarX, 
            healthBarY,
            healthBarWidth,
            healthBarHeight
        );
        // Vẽ phần máu còn lại (màu xanh lá)
        ctx.fillStyle = "green";
        ctx.fillRect(
            healthBarX, 
            healthBarY,
            healthBarWidth * healthPercentage,
            healthBarHeight
        );

      ctx.restore();
    }
  };

  updateAnimation();
};
