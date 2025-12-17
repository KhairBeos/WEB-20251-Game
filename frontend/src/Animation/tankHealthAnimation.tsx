import { RefObject } from "react";
import { KeyMap } from "../Model/KeyMap";
import { TankState, TankAnimationState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";

export const tankHealthAnimation = (
  ctx: CanvasRenderingContext2D,
  tankState: RefObject<TankState>,
  keysPressed: RefObject<KeyMap>,
  featureFrames?: RefObject<HTMLImageElement[]>,
  featureImages?: Record<string, HTMLImageElement> | undefined,
  animStateRef?: RefObject<TankAnimationState>
) => {
  // small helper to draw rounded rects
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill = false,
    stroke = true
  ) => {
    const r = Math.max(0, Math.min(radius, Math.min(width / 2, height / 2)));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  };
  // --- HÀM CẬP NHẬT HOẠT ẢNH ---
  const updateAnimation = () => {
    const tankStates = tankState.current.tankStates;
    const serverTimestamp = tankState.current.serverTimestamp;
   
    // Duyệt qua tất cả các tank trong trạng thái nhận được từ server
    for (const playerId in tankStates) {
      const p = tankStates[playerId];

      // ensure anim state object exists for this player
      if (animStateRef && !animStateRef.current) {
        animStateRef.current = {} as any;
      }
      const animState = animStateRef?.current as any;
      if (animState && !animState[playerId]) {
        animState[playerId] = { frameIndex: 0, frameCounter: 0, isMoving: false } as any;
      }
      const as = animState ? animState[playerId] : undefined;

      // detect pickup / buff changes to trigger indicators
      const now = Date.now();
      if (as) {
        as.lastSeen = as.lastSeen || {};
        as.buffExp = as.buffExp || {};
        as.buffMeta = as.buffMeta || {};

        // Initialize lastSeen on first appearance (do not trigger)
        if (typeof as.lastSeen.health !== 'number') {
          as.lastSeen.health = p.health;
        }
        if (typeof as.lastSeen.lastHealthPickupTime !== 'number') {
          as.lastSeen.lastHealthPickupTime = (p as any).lastHealthPickupTime || 0;
        }
        if (typeof as.lastSeen.shield !== 'number') {
          as.lastSeen.shield = (p as any).shield || 0;
        }
        if (typeof as.lastSeen.shieldUntil !== 'number') {
          as.lastSeen.shieldUntil = (p as any).shieldUntil || 0;
        }
        if (typeof as.lastSeen.speedBoostUntil !== 'number') {
          as.lastSeen.speedBoostUntil = (p as any).speedBoostUntil || 0;
        }
        if (typeof as.lastSeen.damageBoostUntil !== 'number') {
          as.lastSeen.damageBoostUntil = (p as any).damageBoostUntil || 0;
        }

        // health: if lastHealthPickupTime changed, show 2s indicator
        if ((p as any).lastHealthPickupTime && (p as any).lastHealthPickupTime > (as.lastSeen.lastHealthPickupTime || 0)) {
          as.buffExp.health = now + 2000; // 2 seconds
          as.buffMeta.health = 2000;
        }

        // shield: server sets shieldUntil timestamp (ms epoch)
        if ((p as any).shieldUntil && (p as any).shieldUntil > (as.lastSeen.shieldUntil || 0)) {
          const until = (p as any).shieldUntil as number;
          as.buffExp.shield = until;
          const approxTotal = Math.max(1000, until - now);
          as.buffMeta.shield = approxTotal;
        }

        // speed boost: server sets speedBoostUntil timestamp (ms epoch)
        if ((p as any).speedBoostUntil && (p as any).speedBoostUntil > (as.lastSeen.speedBoostUntil || 0)) {
          const until = (p as any).speedBoostUntil as number;
          as.buffExp.speed = until;
          // estimate total duration from client clock
          const approxTotal = Math.max(1000, until - now);
          as.buffMeta.speed = approxTotal;
        }

        // damage boost
        if ((p as any).damageBoostUntil && (p as any).damageBoostUntil > (as.lastSeen.damageBoostUntil || 0)) {
          const until = (p as any).damageBoostUntil as number;
          as.buffExp.damage = until;
          const approxTotal = Math.max(1000, until - now);
          as.buffMeta.damage = approxTotal;
        }

        // update lastSeen values
        as.lastSeen.health = p.health;
        as.lastSeen.lastHealthPickupTime = (p as any).lastHealthPickupTime || 0;
        as.lastSeen.shield = (p as any).shield || 0;
        as.lastSeen.shieldUntil = (p as any).shieldUntil || 0;
        as.lastSeen.speedBoostUntil = (p as any).speedBoostUntil || 0;
        as.lastSeen.damageBoostUntil = (p as any).damageBoostUntil || 0;
      }

      ctx.save();

      ctx.translate(p.x, p.y);

        // Vẽ thanh máu dưới tank (ưu tiên dùng ảnh nếu có)
        const healthPercentage = Math.max(0, Math.min(1, p.health / p.maxHealth));
        const img = featureFrames?.current?.[0]; // tank_health_bar.png
        const barW = 68; // chiều rộng hiển thị (mở rộng 1 chút)
        const barH = 12; // chiều cao hiển thị
        const x = -barW / 2;
        const y = p.height / 2 + 18; // gần hơn tới tank

        // Always draw a health bar (use image if available, otherwise fallback to canvas)
        // Vẽ ảnh thanh máu làm nền (empty bar có thể chứa icon trái tim ở bên trái)
        const leftPadding = 13; // reserve space for heart icon on left
        const inset = 2;
        const innerW = Math.max(0, barW - leftPadding - inset * 2);
        const now2 = Date.now();

        if (img) {
          ctx.drawImage(img, x, y, barW, barH);
        } else {
          // fallback background rounded rect
          const radiusRect = 4;
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          roundRect(ctx, x, y, barW, barH, radiusRect, true, false);
          ctx.strokeStyle = 'rgba(0,0,0,0.6)';
          ctx.lineWidth = 1;
          roundRect(ctx, x, y, barW, barH, radiusRect, false, true);
        }

        // draw health fill (green)
        const innerX = x + leftPadding + inset;
        const innerY = y + inset;
        const filledW = innerW * healthPercentage;
        ctx.fillStyle = '#27ae60';
        roundRect(ctx, innerX, innerY, filledW, barH - inset * 2, 3, true, false);

        // draw health bar border/outline for visibility
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        roundRect(ctx, innerX, innerY, innerW, barH - inset * 2, 3, false, true);

        // draw shield bar above health only while shield buff indicator is active
        const shieldActive = !!(as && (as.buffExp as any)?.shield && (as.buffExp as any).shield > now2);
        if (shieldActive) {
          const shieldVal = (p as any).shield || 0;
          const maxBase = (p as any).maxShield || p.maxHealth || 100;
          const shieldPct = Math.max(0, Math.min(1, shieldVal / maxBase));
          const shieldW = innerW * shieldPct;
          const shieldH = Math.max(4, Math.floor((barH - inset * 2) / 2));
          const shieldX = innerX;
          const shieldY = innerY - shieldH - 6;
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          roundRect(ctx, shieldX, shieldY, shieldW, shieldH, 3, true, false);
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 1;
          roundRect(ctx, shieldX, shieldY, innerW, shieldH, 3, false, true);
        }

        // collect active buffs in requested order: health, damage, speed, shield
        const order: Array<{key: 'health'|'damage'|'speed'|'shield', color: string}> = [
          { key: 'health', color: '#e74c3c' },
          { key: 'damage', color: '#e67e22' },
          { key: 'speed', color: '#f1c40f' },
          { key: 'shield', color: '#ffffff' },
        ];

        const active: Array<{key:string, color:string, exp:number, total:number}> = [];
        if (as) {
          for (const o of order) {
            const exp = (as.buffExp as any)?.[o.key];
            if (exp && exp > now2) {
              const metaTotal = (as.buffMeta as any)?.[o.key] || Math.max(1000, exp - now2);
              active.push({ key: o.key, color: o.color, exp, total: metaTotal });
              console.log(`[BUFF] Player ${playerId}: ${o.key} buff active until ${exp}, remaining ${exp - now2}ms`);
            }
          }
        }

        if (active.length > 0) {
          const spacing = 30;
          const startX = -((active.length - 1) * spacing) / 2;
          const radius = 12;

          const drawRingAt = (cx: number, cy: number, progress: number, color: string) => {
            // background
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fill();
            // progress arc
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = color;
            ctx.arc(cx, cy, radius - 1.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            ctx.stroke();
          };

          for (let i = 0; i < active.length; i++) {
            const it = active[i];
            const rem = Math.max(0, it.exp - now2);
            const total = Math.max(1, it.total);
            const progress = 1 - rem / total;
            const px = startX + i * spacing;
            const py = -(p.height / 2) - 10;
            drawRingAt(px, py, progress, it.color);
            // draw icon (map key: 'health' -> 'health_buff', etc)
            const iconKey = it.key === 'health' ? 'health_buff' : it.key;
            const icon = (featureImages as any)?.[iconKey];
            if (icon) {
              const iw = 18;
              const ih = 18;
              ctx.drawImage(icon, px - iw / 2, py - ih / 2, iw, ih);
            }
          }
        }

        ctx.restore();
    }
  };

  updateAnimation();
};
