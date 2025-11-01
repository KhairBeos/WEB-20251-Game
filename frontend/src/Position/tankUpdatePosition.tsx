import { RefObject } from "react";
import {
  PLAYER_SPEED,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TANK_ROTATE_SPEED,
} from "../GlobalSetting";
import { KeyMap } from "../Model/KeyMap";
import { Tank, TankInput } from "../Model/Tank";
import { TankGun } from "../Model/TankGun";
import { Socket } from "socket.io-client";
import { dir } from "console";

export const tankUpdatePosistion = (
  tank: RefObject<Tank>,
  tankGun: RefObject<TankGun>,
  keysPressed: RefObject<KeyMap>,
  socket: Socket|null
) => {
  const updatePosition = () => {
    const p = tank.current;
    const gun = tankGun.current;
    const keys = keysPressed.current;
    
    var tankInput : TankInput = {
      direction: 'none',
      rotate: 'none',
      clientTimestamp: Date.now(),
    }

    // Xử lý quay xe tăng
    if (keys["a"]) tankInput.rotate = 'left';
    
    if (keys["d"]) tankInput.rotate = 'right';
    
    if (keys["w"]) tankInput.direction = 'forward';
     
    if (keys["s"]) tankInput.direction = 'backward';


    // Gửi trạng thái đầu vào của người chơi lên server
    if(socket){
      //console.log("Sending input:", tankInput);
      socket.emit('tankInput', tankInput);
    }

    
  };
  updatePosition();
};
