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
}
