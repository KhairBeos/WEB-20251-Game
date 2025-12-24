import { RefObject } from "react";
import {
  PLAYER_SPEED,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TANK_ROTATE_SPEED,
} from "../GlobalSetting";
import { KeyMap } from "../Model/KeyMap";
import { Tank, TankInput } from "../Model/Tank";
import { TankGun, TankGunAnimationState } from "../Model/TankGun";
import { Socket } from "socket.io-client";
import { TouchInputHandle, TouchState } from "../Hook/useTouchInput";
import { dir } from "console";

export const tankUpdatePosistion = (
  keysPressed: RefObject<KeyMap>,
  tankGunAnimationState: RefObject<TankGunAnimationState>,
  socket: Socket|null,
  touchInput?: TouchInputHandle,
  tankState?: RefObject<any>,
) => {
  const updatePosition = () => {
    
    const playerId = socket ? socket.id : null;
    if(!playerId) return;
    
    const keys = keysPressed.current;
    const touch = touchInput?.state.current;
    const tankStates = tankState?.current?.tankStates;
    
    const tankInput : TankInput = {
      direction: 'none',
      rotate: 'none',
      clientTimestamp: Date.now(),
      isFire: false,
    }

    // Handle keyboard input
    if (keys["a"]) tankInput.rotate = 'left';
    if (keys["d"]) tankInput.rotate = 'right';
    if (keys["w"]) tankInput.direction = 'forward';
    if (keys["s"]) tankInput.direction = 'backward';
    if( keys["j"] ) tankInput.isFire = true;

    // Handle touch input (prefer digital for D-pad to mimic keyboard)
    if (touch) {
      if (touch.digitalRotate !== 'none') {
        tankInput.rotate = touch.digitalRotate;
      }
      if (touch.digitalDirection !== 'none') {
        tankInput.direction = touch.digitalDirection;
      }

      // Analog fallback (joystick)
      if (touch.digitalRotate === 'none' && touch.digitalDirection === 'none') {
        if (Math.abs(touch.vx) > 0.1 || Math.abs(touch.vy) > 0.1) {
          const angle = Math.atan2(touch.vx, -touch.vy) * (180 / Math.PI);
          let tankDegree = angle;
          if (tankDegree < 0) tankDegree += 360;

          const myTank = Object.values(tankStates || {}).find(t => t.id === playerId);
          if (myTank) {
            const currentDegree = myTank.degree;
            const angleDiff = ((tankDegree - currentDegree + 180) % 360) - 180;

            if (Math.abs(angleDiff) > 5) {
              tankInput.rotate = angleDiff > 0 ? 'right' : 'left';
            }

            const magnitude = Math.sqrt(touch.vx * touch.vx + touch.vy * touch.vy);
            if (magnitude > 0.1) {
              tankInput.direction = 'forward';
            }
          }
        }
      }

      if (touch.isFiring) tankInput.isFire = true;
    }

    // Gửi trạng thái đầu vào của người chơi lên server
    if(socket){
      socket.emit('tankInput', tankInput);
    }

    
  };
  updatePosition();
};
