// src/Model/MapData.ts

// QUY ƯỚC MÃ SỐ (MATRIX CODE):
// 0: Đất (Đi được)
// 4: Tower Full máu (Gốc - Vẽ ảnh tại đây)
// 10: Tree Bất tử (Gốc - Vẽ ảnh tại đây)
// 9: Trụ Spawn
// 99: VẬT CẢN TÀNG HÌNH (Phần thân của Tower/Tree - Không vẽ, chỉ chặn đường)

export const MAP_ROWS = 80; // 80 ô * 40px = 3200px
export const MAP_COLS = 80;

const generateMap = () => {
  // 1. Tạo mảng 2 chiều toàn số 0 (Đất)
  const map: number[][] = Array(MAP_ROWS).fill(0).map(() => Array(MAP_COLS).fill(0));

  // --- HÀM HỖ TRỢ: Đặt vật thể to vào map ---
  // r, c: Tọa độ dòng, cột
  // type: Loại vật thể (4: Tower, 10: Tree)
  const placeObject = (r: number, c: number, type: number) => {
    let size = 1;
    if (type === 4) size = 2;  // Tower chiếm 2x2 ô (80x80px)
    if (type === 10) size = 3; // Tree chiếm 3x3 ô (120x120px)

    // Kiểm tra biên: Nếu đặt bị lòi ra ngoài map thì thôi
    if (r + size > MAP_ROWS || c + size > MAP_COLS) return;

    // Kiểm tra xem chỗ này có trống không (toàn số 0 mới đặt)
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (map[r + i][c + j] !== 0) return; // Đã có vật khác chắn -> Hủy
      }
    }

    // --- BẮT ĐẦU ĐẶT ---
    // 1. Đặt Ô GỐC (Top-Left) để Frontend vẽ ảnh
    map[r][c] = type;

    // 2. Đặt các ô còn lại là 99 (Blocker) để Backend chặn đường
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i === 0 && j === 0) continue; // Bỏ qua ô gốc
        map[r + i][c + j] = 99; 
      }
    }
  };

  // --- BƯỚC 1: TẠO VIỀN MAP BẰNG CÂY (TREE 3x3) ---
  // Chạy vòng lặp đặt cây bao quanh
  for (let i = 0; i < MAP_COLS; i += 3) {
     placeObject(0, i, 10);            // Mép trên
     placeObject(MAP_ROWS - 3, i, 10); // Mép dưới
  }
  for (let i = 0; i < MAP_ROWS; i += 3) {
     placeObject(i, 0, 10);            // Mép trái
     placeObject(i, MAP_COLS - 3, 10); // Mép phải
  }

  // --- BƯỚC 2: TẠO MÊ CUNG TOWER (TOWER 2x2) ---
  // Quét qua vùng giữa bản đồ
  for (let r = 4; r < MAP_ROWS - 4; r += 2) {
    for (let c = 4; c < MAP_COLS - 4; c += 2) {
        // Random ngẫu nhiên: 20% cơ hội mọc ra Tower
        if (Math.random() < 0.2) {
            placeObject(r, c, 4);
        }
        
        // Hoặc 2% cơ hội mọc ra Cây to ở giữa map làm chỗ nấp
        else if (Math.random() < 0.02) {
            placeObject(r, c, 10);
        }
    }
  }

  // --- BƯỚC 3: ĐẶT TRỤ SPAWN (Số 9) ---
  // Đặt ở 4 góc thoáng và dọn dẹp xung quanh
  const spawns = [
      { r: 6, c: 6 }, 
      { r: 6, c: MAP_COLS - 8 },
      { r: MAP_ROWS - 8, c: 6 }, 
      { r: MAP_ROWS - 8, c: MAP_COLS - 8 }
  ];

  spawns.forEach(pos => {
      // Dọn sạch khu vực 5x5 quanh spawn để tank không kẹt
      for(let i = -2; i <= 3; i++) {
          for(let j = -2; j <= 3; j++) {
              if(map[pos.r + i] && map[pos.r + i][pos.c + j] !== undefined) {
                  map[pos.r + i][pos.c + j] = 0;
              }
          }
      }
      map[pos.r][pos.c] = 9; // Đặt spawn
  });

  return map;
};

export const INITIAL_MAP = generateMap();