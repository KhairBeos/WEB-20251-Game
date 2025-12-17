import { Tank } from '../model/Tank';

export function tankCollision(tankStates: { [playerId: string]: Tank }) {
  for (const id in tankStates) {
    const tankA = tankStates[id];
    for (const otherId in tankStates) {
      if (id === otherId) continue;
      const tankB = tankStates[otherId];

      const dx = tankB.x - tankA.x;
      const dy = tankB.y - tankA.y;
      const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);
      const minDistance = tankA.radius + tankB.radius;

      // Tính lực đẩy 2 tank ra xa nhau nếu chúng chồng lấn
      if (distance < minDistance) {
        const overlap = minDistance - distance;
        const adjustX = (dx / distance) * (overlap / 2);
        const adjustY = (dy / distance) * (overlap / 2);
        tankA.x -= adjustX;
        tankA.y -= adjustY;
        tankB.x += adjustX;
        tankB.y += adjustY;
      }
    }
  }
}
