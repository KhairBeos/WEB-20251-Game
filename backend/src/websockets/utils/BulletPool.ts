import { Bullet } from '../model/Bullet';

export class BulletPool {
  private pool: Bullet[] = [];
  private free: Bullet[] = [];
  private readonly capacity: number;

  constructor(capacity = 1000) {
    this.capacity = capacity;
    for (let i = 0; i < capacity; i++) {
      const bullet: Bullet = {
        id: '',
        ownerId: '',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        degree: 0,
        speed: 0,
        damage: 0,
        lastTimeFired: 0,
        totalDistance: 0,
      };
      this.pool.push(bullet);
    }
    this.free = [...this.pool];
  }

  acquire(): Bullet | null {
    if (this.free.length === 0) return null;
    return this.free.pop() as Bullet;
  }

  release(bullet: Bullet) {
    // Reset fields to avoid stale data
    bullet.id = '';
    bullet.ownerId = '';
    bullet.x = 0;
    bullet.y = 0;
    bullet.width = 0;
    bullet.height = 0;
    bullet.degree = 0;
    bullet.speed = 0;
    bullet.damage = 0;
    bullet.lastTimeFired = 0;
    bullet.totalDistance = 0;
    if (this.free.length < this.capacity) {
      this.free.push(bullet);
    }
  }

  available() {
    return this.free.length;
  }
}
