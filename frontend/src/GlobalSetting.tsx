export const PLAYER_SPEED = 5;
export const TANK_ROTATE_SPEED = 3;

// Kích thước Canvas
export const CANVAS_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 1920;
export const CANVAS_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 1080;

export const ANIMATION_SPEED = 10; 
export const COOLDOWN_MS = 1000;

// --- CẤU HÌNH MAP MỚI ---

// Đơn vị cơ sở (Base Unit). Mọi vật thể sẽ là bội số của số này.
export const TILE_SIZE = 40; 

// Kích thước Map (80 ô * 40px = 3200px rộng)
export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 80;
