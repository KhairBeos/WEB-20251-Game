// backend/src/Model/MapData.ts

// QUY ƯỚC MÃ SỐ (MATRIX CODE):
// 0: Đất
// 4: Tower Full máu (Gốc)
// 10: Tree Bất tử (Gốc)
// 9: Trụ Spawn
// 99: VẬT CẢN TÀNG HÌNH

export const MAP_ROWS = 80;
export const MAP_COLS = 80;
export const TILE_SIZE = 40; // Đơn vị cơ sở
export type MapCell = {
  root_r: number;
  root_c: number;
  val: number;
}

// 3. Spawn Point
export const SPAWNPOINTS = [
  { r: 6, c: 6 },
  { r: 6, c: MAP_COLS - 8 },
  { r: MAP_ROWS - 8, c: 6 },
  { r: MAP_ROWS - 8, c: MAP_COLS - 8 },
];

const generateMap = () => {

  // Tạo ma trận map ban đầu
  const map: MapCell[][] = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    const row: MapCell[] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      row.push({ root_r: -1, root_c: -1, val: 0 });
    }
    map.push(row);
  }
 
  // Hàm hỗ trợ đặt vật thể
  const placeObject = (r: number, c: number, type: number) => {
    let size = 1;
    if (type === 4) size = 2; // Tower 2x2
    if (type === 10) size = 3; // Tree 3x3

    if (r + size > MAP_ROWS || c + size > MAP_COLS) return;

    // Check trống
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (map[r + i][c + j].val !== 0) return;
      }
    }

    // Đặt gốc
    map[r][c] = { root_r: r, root_c: c, val: type };
    // Đặt các ô con
    if (size > 1) {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (i === 0 && j === 0) continue;
          map[r + i][c + j] = { root_r: r, root_c: c, val: 99 }; // Thân vật cản tàng hình
        } 
      }
    } 
  };

  // 1. Viền cây
  for (let i = 0; i < MAP_COLS; i += 3) {
    placeObject(0, i, 10);
    placeObject(MAP_ROWS - 3, i, 10);
  }
  for (let i = 0; i < MAP_ROWS; i += 3) {
    placeObject(i, 0, 10);
    placeObject(i, MAP_COLS - 3, 10);
  }

  // 2. Mê cung Tower
  for (let r = 4; r < MAP_ROWS - 4; r += 2) {
    for (let c = 4; c < MAP_COLS - 4; c += 2) {
      if (Math.random() < 0.2) {
        placeObject(r, c, 4);
      } else if (Math.random() < 0.02) {
        placeObject(r, c, 10);
      }
    }
  }


  SPAWNPOINTS.forEach((pos) => {
    // Dọn dẹp 5x5 quanh spawn
    for (let i = -2; i <= 3; i++) {
      for (let j = -2; j <= 3; j++) {
        if (map[pos.r + i] && map[pos.r + i][pos.c + j] !== undefined) 
          map[pos.r + i][pos.c + j] = { 
            root_r: -1, root_c: -1, val: 0  
          }
      }
    }
    // Đặt trụ spawn
    //map[pos.r][pos.c] = { root_r: pos.r, root_c: pos.c, val: 9 };

  });

  return map;
};

export const INITIAL_MAP = generateMap();
