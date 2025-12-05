import { Injectable } from '@nestjs/common';
import { Bullet } from '../model/Bullet';
import { Tank } from '../model/Tank';

@Injectable()
export class GridSpatial {
  // Định nghĩa kích thước ô lưới
  CELL_SIZE = 100; // Ví dụ: mỗi ô lưới là 100x100 đơn vị
  grid: { [key: string]: { tanks: Tank[]; bullets: Bullet[] } } = {};

  constructor() {}

  getCellKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.CELL_SIZE);
    const gridY = Math.floor(y / this.CELL_SIZE);
    return `${gridX}_${gridY}`;
  }

  updateGrid(tanks: Tank[], bullets: Bullet[]) {
    // Xóa grid cũ
    Object.keys(this.grid).forEach((key) => {
      this.grid[key].tanks = [];
      this.grid[key].bullets = [];
    });

    // Thêm Tanks
    tanks.forEach((tank) => {
      const key = this.getCellKey(tank.x, tank.y);
      if (!this.grid[key]) this.grid[key] = { tanks: [], bullets: [] };
      this.grid[key].tanks.push(tank);
    });

    // Thêm Bullets
    bullets.forEach((bullet) => {
      // Đối với bullets, bạn nên kiểm tra tất cả các ô nó đi qua trong frame đó
      // Nhưng để đơn giản, ta chỉ dùng vị trí tâm (x, y)
      const key = this.getCellKey(bullet.x, bullet.y);
      if (!this.grid[key]) this.grid[key] = { tanks: [], bullets: [] };
      this.grid[key].bullets.push(bullet);
    });
  }

  getTanksNear(x: number, y: number): Tank[] {
    const key = this.getCellKey(x, y);

    // Lấy tất cả các tank trong ô lưới hiện tại và các ô lân cận
    const nearbyTanks: Tank[] = [];
    const [gridX, gridY] = key.split('_').map(Number);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborKey = `${gridX + dx}_${gridY + dy}`;
        if (this.grid[neighborKey]) {
          nearbyTanks.push(...this.grid[neighborKey].tanks);
        }
      }
    }
    return nearbyTanks;
  }

  getBulletsNear(x: number, y: number): Bullet[] {
    const key = this.getCellKey(x, y);
    const nearbyBullets: Bullet[] = [];
    const [gridX, gridY] = key.split('_').map(Number);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborKey = `${gridX + dx}_${gridY + dy}`;
        if (this.grid[neighborKey]) {
          nearbyBullets.push(...this.grid[neighborKey].bullets);
        }
      }
    }
    return nearbyBullets;
  }
}
