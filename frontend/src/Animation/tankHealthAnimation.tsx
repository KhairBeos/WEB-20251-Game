import { RefObject } from "react";
import { KeyMap } from "../Model/KeyMap";
import { TankState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";

export const tankHealthAnimation = (
  ctx: CanvasRenderingContext2D,
   tankState: RefObject<TankState>,
  keysPressed: RefObject<KeyMap>,
) => {
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    const tankStates = tankState.current.tankStates;
    const serverTimestamp = tankState.current.serverTimestamp;
   
    // Duyệt qua tất cả các tank trong trạng thái nhận được từ server
    for (const playerId in tankStates) {
      const p = tankStates[playerId];

      ctx.save();

      // 2. Di chuyển gốc tọa độ đến tâm của tank
      // Tâm X = tank.x + tank.width / 2
      // Tâm Y = tank.y + tank.height / 2
      ctx.translate(p.x, p.y);

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

        // Vẽ tên dưới thanh máu
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p.name, 0, healthBarY + healthBarHeight + 14);

        // Vẽ level bên trái thanh máu
        ctx.fillStyle = "yellow";
        ctx.font = "14px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`Lv.${p.level}`, healthBarX - 10, healthBarY + healthBarHeight);

        // Vẽ số máu bên phải thanh máu
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`${p.health}/${p.maxHealth}`, healthBarX + healthBarWidth + 10, healthBarY + healthBarHeight);
        

      ctx.restore();
    }
  };

  updateAnimation();
};
