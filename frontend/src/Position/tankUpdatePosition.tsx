import { RefObject } from "react";
import {
  PLAYER_SPEED,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TANK_ROTATE_SPEED,
} from "../GlobalSetting";
import { KeyMap } from "../Model/KeyMap";
import { Tank } from "../Model/Tank";
import { TankGun } from "../Model/TankGun";

export const tankUpdatePosistion = (
  tank: RefObject<Tank>,
  tankGun: RefObject<TankGun>,
  keysPressed: RefObject<KeyMap>
) => {
  const updatePosition = () => {
    const p = tank.current;
    const gun = tankGun.current;
    const keys = keysPressed.current;
    //console.log("posx:"+p.x+","+"posy:"+p.y)

    let newX = p.x;
    let newY = p.y;
    let newDegree = p.degree;
    let isMoving = false;

    // Tính toán di chuyển ngang (A: trái, D: phải)
    if (keys["a"]) {
      newDegree -= TANK_ROTATE_SPEED;
      isMoving = true;
    }
    if (keys["d"]) {
      newDegree += TANK_ROTATE_SPEED;
      isMoving = true;
    }

    // Giới hạn góc quay từ 0 đến 359 (hoặc -180 đến 180 tùy ý)
    newDegree = newDegree % 360;
    if (newDegree < 0) {
      newDegree += 360;
    }

    // 1. Chuyển đổi góc quay từ độ sang Radian
    const angleInRadians = newDegree * (Math.PI / 180);

    // Khởi tạo thay đổi X và Y
    let deltaX = 0;
    let deltaY = 0;

    // Tính toán sự thay đổi vị trí theo hướng đang quay:
    if (keys["w"]) {
      // Tiến lên (W): Di chuyển theo hướng góc
      // Trong hệ tọa độ Canvas (Y dương hướng xuống),
      // khi tank quay về bên phải (degree tăng), X tăng (sin), Y giảm (cos)
      deltaX = PLAYER_SPEED * Math.sin(angleInRadians);
      deltaY = -PLAYER_SPEED * Math.cos(angleInRadians); // Y âm để đi lên
      isMoving = true;
    }
    if (keys["s"]) {
      // Lùi lại (S): Di chuyển ngược hướng góc
      deltaX = -PLAYER_SPEED * Math.sin(angleInRadians);
      deltaY = PLAYER_SPEED * Math.cos(angleInRadians); // Y dương để đi xuống
      isMoving = true;
    }

    // 3. Cập nhật vị trí mới
    // Sử dụng deltaX và deltaY để cập nhật newX và newY
    newX += deltaX;
    newY += deltaY;

    // 1. Áp dụng vị trí mới cho Tank
    p.x = newX;
    p.y = newY;
    p.degree = newDegree;


    // 1. Áp dụng vị trí mới cho Tank Gun

    gun.x = newX
    gun.y = newY
    gun.degree = newDegree

    // 2. Xử lý giới hạn khung hình (Clamping)

    // Giới hạn trục X
    if (p.x + p.width / 2 > CANVAS_WIDTH) {
      p.x = CANVAS_WIDTH - p.width / 2;
    } else if (p.x - p.width / 2 < 0) {
      p.x = p.width / 2;
    }

    // Giới hạn trục Y
    if (p.y + p.height / 2 > CANVAS_HEIGHT) {
      p.y = CANVAS_HEIGHT - p.height / 2;
    } else if (p.y - p.height / 2 < 0) {
      p.y = p.height / 2;
    }

    return isMoving; // Trả về true nếu nhân vật đang di chuyển
  };
  updatePosition();
};
