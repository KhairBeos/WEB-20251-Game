import { RefObject } from "react";
import { KeyMap } from "../Model/KeyMap";
import { TankState, TankAnimationState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";
import { BUSH_SELF_ALPHA } from "../GlobalSetting";


export const tankHealthAnimation = (
  ctx: CanvasRenderingContext2D,
  tankState: RefObject<TankState>,
  featureImages: RefObject<HTMLImageElement[]> ,
  viewerId?: string,
  itemSoundRef?: RefObject<HTMLAudioElement>,

) => {
  const healthItemImg = featureImages.current ? featureImages.current[0] : null;
  const shieldItemImg = featureImages.current ? featureImages.current[1] : null;
  const speedItemImg = featureImages.current ? featureImages.current[2] : null;
  const damageItemImg = featureImages.current ? featureImages.current[3] : null;

  if (!healthItemImg || !shieldItemImg || !speedItemImg || !damageItemImg) {
    return;
  }

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
      ctx.translate(p.x, p.y);

       // Nếu tank của mình và đang ở trong bụi, vẽ mờ đi
      if (playerId === viewerId && p.inBush != "none") {
        ctx.globalAlpha = BUSH_SELF_ALPHA;
      }
      
        // Nếu không phải tank của mình và tank đó đang ở trong bụi, không vẽ lên canvas
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

        // Vẽ thanh máu ở dưới tank
        const healthBarWidth = 50;
        const healthBarHeight = 6;
        const healthBarX = -healthBarWidth / 2;
        const healthBarY = p.height / 2 + 10;

        // Vẽ nền thanh máu (màu xám)
        ctx.fillStyle = "gray";
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // Tính toán tỉ lệ máu hiện tại
        const healthRatio = p.health / p.maxHealth;
        // Vẽ phần máu hiện tại (màu xanh lá)
        ctx.fillStyle = "lime";
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthRatio, healthBarHeight);

        // Vẽ tên dưới thanh máu
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p.name, 0, healthBarY + healthBarHeight + 16);

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
        
        // Vẽ icon item ở trên phía trên tank
        const itemIconSize = 20;
        const itemIconX = -itemIconSize / 2;
        const itemIconY = -p.height / 2 - itemIconSize - 15;
        // ctx.drawImage(shieldItemImg, itemIconX, itemIconY, itemIconSize, itemIconSize);
        
        if(p.itemKind === 'health') {
          ctx.drawImage(healthItemImg, itemIconX, itemIconY, itemIconSize, itemIconSize);
        }
        else if(p.itemKind === 'shield') {
          ctx.drawImage(shieldItemImg, itemIconX, itemIconY, itemIconSize, itemIconSize);
        }
        else if(p.itemKind === 'speed') {
          ctx.drawImage(speedItemImg, itemIconX, itemIconY, itemIconSize, itemIconSize);
        }
        else if(p.itemKind === 'damage') {
          ctx.drawImage(damageItemImg, itemIconX, itemIconY, itemIconSize, itemIconSize);
        }
        
        // Vẽ shield bar nếu có shield
        if(p.itemKind === 'shield') {
          const shieldBarWidth = 50;
          const shieldBarHeight = 4;
          const shieldBarX = -shieldBarWidth / 2;
          const shieldBarY = healthBarY + healthBarHeight - 2;
          // Vẽ thanh shield (màu trắng)
          ctx.fillStyle = "white";
          ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth *(p.shield / 50), shieldBarHeight);
        }

        // Vẽ ring thời gian còn lại của item
        if(p.itemKind !== 'none') {
          const nowTs = Date.now();
          const timeLeft = p.itemExpire - nowTs;
          let totalDuration = 0;
          if(p.itemKind === 'shield') totalDuration = 10000;
          else if(p.itemKind === 'speed') totalDuration = 10000;
          else if(p.itemKind === 'damage') totalDuration = 10000;
          else if(p.itemKind === 'health') totalDuration = 2000;
          const angle = (timeLeft / totalDuration) * 2 * Math.PI;
          // Vẽ vòng tròn nền (màu xám)
          ctx.beginPath();
          ctx.strokeStyle = 'gray';
          ctx.lineWidth = 3;
          ctx.arc(0, itemIconY + itemIconSize / 2, itemIconSize / 2 + 4, 0, 2 * Math.PI);
          ctx.stroke();
          // Vẽ vòng tròn thời gian còn lại (màu vàng)
          ctx.beginPath();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.arc(0, itemIconY + itemIconSize / 2, itemIconSize / 2 + 4, -Math.PI / 2, -Math.PI / 2 + angle, false);
          ctx.stroke();
        }

      ctx.restore();
    }
  };

  updateAnimation();
};
