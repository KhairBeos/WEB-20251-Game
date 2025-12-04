// QUY ƯỚC MÃ SỐ (MATRIX CODE):
// 0: Đất (Đi được)
// 4: Tower (Gốc) 2x2 tile (80x80)
// 10: Tree viền (Gốc) 1x2 tile (40x80)
// 11..14: Bush (Gốc) 3x2 tile (120x80) - 4 biến thể
// 9: Trụ Spawn
// 99: VẬT CẢN TÀNG HÌNH (Phần thân của Tower/Tree - Không vẽ, chỉ chặn đường)

export const MAP_ROWS = 80; // 80 ô * 40px = 3200px
export const MAP_COLS = 80;

export const TILE_SIZE = 40; // Kích thước mỗi ô là 40x40px

export type MapCell = {
  root_r: number; // Dòng ô gốc (Top-Left) của vật thể chiếm ô này
  root_c: number; // Cột ô gốc (Top-Left) của vật thể chiếm ô này
  val: number;    // Giá trị ô (theo quy ước trên)
};
