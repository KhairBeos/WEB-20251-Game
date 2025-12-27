// backend/src/Model/MapData.ts

// QUY ƯỚC MÃ SỐ (MATRIX CODE):
// 0: Đất
// 4: Tower Full máu (Gốc) - 2x2 tile (80x80)
// 10: Tree viền (Gốc) - 1x2 tile (40x80)
// 11..14: Bush (Gốc) - 3x2 tile (120x80) với 4 biến thể
// 9: Trụ Spawn
// 99: VẬT CẢN TÀNG HÌNH
// 101: Pickup - Health
// 102: Pickup - Shield
// 103: Pickup - Speed Boost
// 104: Pickup - Damage Boost

export const MAP_ROWS = 80;
export const MAP_COLS = 80;
export const TILE_SIZE = 40; // Đơn vị cơ sở
export type MapCell = {
  root_r: number;
  root_c: number;
  val: number;
};

export type MapData = {
  map: MapCell[][];
  itemNumber: number;
  towerNumber: number;
  bushNumber: number;
};

// 3. Spawn Point
export const SPAWNPOINTS = [
  { r: 6, c: 6 },
  { r: 6, c: MAP_COLS - 8 },
  { r: MAP_ROWS - 8, c: 6 },
  { r: MAP_ROWS - 8, c: MAP_COLS - 8 },
];

export const generateMap = (): MapData => {
  let itemNumber = 0;
  let towerNumber = 0;
  let bushNumber = 0;

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
    let sizeW = 1; // theo cột
    let sizeH = 1; // theo hàng
    if (type === 4) {
      sizeW = 2;
      sizeH = 2;
    } // Tower 2x2
    else if (type === 10) {
      sizeW = 1;
      sizeH = 2;
    } // Tree viền 1x2
    else if (type >= 11 && type <= 14) {
      sizeW = 3;
      sizeH = 2;
    } // Bush 3x2

    if (r + sizeH > MAP_ROWS || c + sizeW > MAP_COLS) return false;

    // Check trống
    for (let i = 0; i < sizeH; i++) {
      for (let j = 0; j < sizeW; j++) {
        if (map[r + i][c + j].val !== 0) return false;
      }
    }

    // Đặt gốc
    map[r][c] = { root_r: r, root_c: c, val: type };
    // Đặt các ô con
    if (sizeW > 1 || sizeH > 1) {
      for (let i = 0; i < sizeH; i++) {
        for (let j = 0; j < sizeW; j++) {
          if (i === 0 && j === 0) continue;
          map[r + i][c + j] = { root_r: r, root_c: c, val: 99 }; // Thân vật cản tàng hình
        }
      }
    }
    return true;
  };

  // 1. Viền cây (Tree 40x80 = 1x2 tile)
  // Mép trên và dưới: quét theo cột từng 1 tile
  for (let c = 0; c < MAP_COLS; c += 1) {
    placeObject(0, c, 10); // Top
    placeObject(MAP_ROWS - 2, c, 10); // Bottom
  }
  // Mép trái và phải: quét theo hàng từng 2 tile (vì cao 2)
  for (let r = 0; r < MAP_ROWS; r += 2) {
    placeObject(r, 0, 10); // Left
    placeObject(r, MAP_COLS - 1, 10); // Right
  }

  // 2. Mê cung Tower
  for (let r = 4; r < MAP_ROWS - 4; r += 2) {
    for (let c = 4; c < MAP_COLS - 4; c += 2) {
      if (Math.random() < 0.2) {
        if (placeObject(r, c, 4)) towerNumber++;
      } else if (Math.random() < 0.05) {
        // Đặt Bush bên trong: chọn ngẫu nhiên 1 trong 4 biến thể 11..14
        const variant = 11 + Math.floor(Math.random() * 4);
        if(placeObject(r, c, variant)) bushNumber++;
      }
    }
  }

  // 3. Spawn một số pickups rải rác ở ô trống (1x1)
  const pickupTypes = [101, 102, 103, 104];
  const desiredPickups = 25; // số lượng mục tiêu
  let placed = 0;
  let safety = 0;
  while (placed < desiredPickups && safety < 5000) {
    safety++;
    const r = Math.floor(Math.random() * MAP_ROWS);
    const c = Math.floor(Math.random() * MAP_COLS);
    // tránh biên viền cây và vùng spawn rộng rãi
    if (r < 3 || r > MAP_ROWS - 4 || c < 3 || c > MAP_COLS - 4) continue;
    let nearSpawn = false;
    for (const sp of SPAWNPOINTS) {
      if (Math.abs(sp.r - r) <= 6 && Math.abs(sp.c - c) <= 6) {
        nearSpawn = true;
        break;
      }
    }
    if (nearSpawn) continue;
    if (map[r][c].val !== 0) continue;
    const type = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
    if(placeObject(r, c, type)) itemNumber++;
    placed++;
  }

  // SPAWNPOINTS.forEach((pos) => {
  //   // Dọn dẹp 5x5 quanh spawn
  //   for (let i = -2; i <= 3; i++) {
  //     for (let j = -2; j <= 3; j++) {
  //       if (map[pos.r + i] && map[pos.r + i][pos.c + j] !== undefined)
  //         map[pos.r + i][pos.c + j] = {
  //           root_r: -1,
  //           root_c: -1,
  //           val: 0,
  //         };
  //     }
  //   }
  //   // Đặt trụ spawn
  //   //map[pos.r][pos.c] = { root_r: pos.r, root_c: pos.c, val: 9 };
  // });

  return {
    map,
    itemNumber,
    towerNumber,
    bushNumber,
  };
};


