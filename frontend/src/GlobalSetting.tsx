export const PLAYER_SPEED = 5;
export const TANK_ROTATE_SPEED = 3;

// Kích thước Canvas
export const CANVAS_WIDTH = typeof window !== 'undefined' ? window.visualViewport?.width || 1920 : 1920;
export const CANVAS_HEIGHT = typeof window !== 'undefined' ? window.visualViewport?.height || 1080 : 1080;

export const MAX_CANVAS_WIDTH = 1920;
export const MAX_CANVAS_HEIGHT = 1080;

export const VISIBLE_COLS = Math.floor(30*1.2); // how many map columns to aim to display
export const VISIBLE_ROWS = Math.floor(18*1.2); // how many map rows to aim to display

export const ANIMATION_SPEED = 10; 
export const COOLDOWN_MS = 1000;

// --- CẤU HÌNH MAP MỚI ---

// Đơn vị cơ sở (Base Unit). Mọi vật thể sẽ là bội số của số này.
export const TILE_SIZE = 40; 

// Kích thước Map (80 ô * 40px = 3200px rộng)
export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 80;

// Hiệu ứng bụi: độ mờ của tank khi chính mình đang ở trong bụi đó
export const BUSH_SELF_ALPHA = 0.55;

// Giới hạn tối đa devicePixelRatio để cân bằng nét/hiệu năng
export const MAX_DPR = 2;
// Viewport dùng kích thước thật của cửa sổ; không ép bội số hay cố định

// Kích thước icon vật phẩm (pickup). Giữ tối đa bằng 1 tile để không đè lên tường/trụ lân cận.
export const PICKUP_ICON_SIZE = 40;
// Kích thước hiển thị Tower (mặc định 2x2 tile = 80x80). Giữ nguyên nếu thấy ổn
export const TOWER_DRAW_SIZE = 80;

// Debug Mode: hiển thị lưới ô, viền va chạm, bán kính tank, pickup collision
export const DEBUG_MODE = false;

// export const SOCKET_URL = "http://localhost:3001";
// export const SOCKET_URL = "https://web-20251-game-95jw.onrender.com";
export const SOCKET_URL = "http://47.128.255.70";


export const levelUpScores = {
  1: 0,
  2: 10,
  3: 11,
  4: 12,
  5: 14,
  6: 16,
  7: 18,
  8: 20,
  9: 23,
  10: 25,
  11: 28,
  12: 31,
  13: 34,
  14: 38,
  15: 41,
  16: 45,
  17: 49,
  18: 54,
  19: 59,
  20: 64,
  21: 70,
  22: 76,
  23: 83,
  24: 90,
  25: 97,
  26: 105,
  27: 113,
  28: 121,
  29: 130,
  30: 139,
  31: 149,
  32: 159,
  33: 170,
  34: 181,
  35: 193,
  36: 205,
  37: 218,
  38: 232,
  39: 246,
  40: 261,
  41: 276,
  42: 292,
  43: 309,
  44: 326,
  45: 344,
  46: 362,
  47: 381,
  48: 401,
  49: 421,
  50: 442,
  51: 464,
  52: 486,
};
