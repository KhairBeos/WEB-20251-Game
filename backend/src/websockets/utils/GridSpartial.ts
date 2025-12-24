import { Injectable } from '@nestjs/common';
import { Bullet } from '../model/Bullet';
import { Tank } from '../model/Tank';

@Injectable()
export class GridSpatial {
  // Định nghĩa kích thước ô lưới
  CELL_SIZE = 160; // ~4 tiles (40px) to keep buckets small
  grid: { [key: string]: { tanks: Tank[]; bullets: Bullet[] } } = {};

  constructor(cellSize = 160) {
    this.CELL_SIZE = cellSize;
  }

  clear() {
    this.grid = {};
  }

  getCellKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.CELL_SIZE);
    const gridY = Math.floor(y / this.CELL_SIZE);
    return `${gridX}_${gridY}`;
  }

  updateGrid(tanks: Tank[], bullets: Bullet[]) {
    // Xóa grid cũ nhanh chóng
    this.clear();

    // Thêm Tanks
    tanks.forEach((tank) => {
      const key = this.getCellKey(tank.x, tank.y);
      if (!this.grid[key]) this.grid[key] = { tanks: [], bullets: [] };
      this.grid[key].tanks.push(tank);
    });

    // Thêm Bullets (theo tâm đạn, đủ nhanh và hợp lý với cellSize 4 tiles)
    bullets.forEach((bullet) => {
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
