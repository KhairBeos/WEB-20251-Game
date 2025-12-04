import { Tank } from '../model/Tank';

export function borderCollision(tank: Tank, mapWidth: number, mapHeight: number) {
  // Giới hạn vị trí của tank trong biên của bản đồ
  const R = tank.radius;
  if (tank.x - R < 0) {
    tank.x = R;
  } else if (tank.x + R > mapWidth) {
    tank.x = mapWidth - R;
  }

  if (tank.y - R < 0) {
    tank.y = R;
  } else if (tank.y + R > mapHeight) {
    tank.y = mapHeight - R;
  }
}
