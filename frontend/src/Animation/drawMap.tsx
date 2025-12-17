import { RefObject } from "react";
import { BUSH_SELF_ALPHA, PICKUP_ICON_SIZE, TOWER_DRAW_SIZE, DEBUG_MODE, TILE_SIZE } from "../GlobalSetting";
import { MAP_COLS, MAP_ROWS, MapCell } from "../Model/MapData";


// --- 4. HÀM VẼ MAP ---
const drawMap = (
    camX:number,
    camY:number,
    dynamicMap: RefObject<MapCell[][]>,
    viewport: RefObject<{ w: number; h: number }>,
    groundImg: RefObject<HTMLImageElement[]>,
    treeImg: RefObject<HTMLImageElement[]>,
    towerImg: RefObject<HTMLImageElement[]>,
    bushImg: RefObject<HTMLImageElement[]>,
    icons: RefObject<Record<string, HTMLImageElement>> | undefined,
        ctx: CanvasRenderingContext2D,
    ) => {
   
    if (dynamicMap.current.length === 0) return;
    const map = dynamicMap.current
    const imgs = {
        ground: groundImg.current[0],
        tree: treeImg.current[0],
        tow4: towerImg.current[0],
        tow3: towerImg.current[1],
        tow2: towerImg.current[2],
        tow1: towerImg.current[3],
        bush1: bushImg.current?.[0],
        bush2: bushImg.current?.[1],
        bush3: bushImg.current?.[2],
        bush4: bushImg.current?.[3],
    }
    const iconImgs = icons?.current || {};
   
    const TILE = TILE_SIZE; // Base unit (use canonical value)

    // Tính toán ô bắt đầu và kết thúc dựa trên vị trí camera và kích thước viewport
    var startCol = Math.floor(camX / TILE);
    // Trừ 1px trước khi chia TILE để tránh mất cột/ hàng biên khi đúng ranh giới
    var endCol = Math.min(MAP_COLS - 1, Math.floor((camX + viewport.current.w - 1) / TILE));
    var startRow = Math.floor(camY / TILE);
    var endRow =  Math.min(MAP_ROWS - 1, Math.floor((camY + viewport.current.h - 1) / TILE));
    // Thêm 2 ô đệm để tránh khoảng trống khi di chuyển
    
    startCol = Math.max(0, startCol - 2);
    startRow = Math.max(0, startRow - 2);
    endCol = Math.min(MAP_COLS - 1, endCol + 2);
    endRow = Math.min(MAP_ROWS - 1, endRow + 2);

    // Vẽ các ô trong vùng nhìn thấy
    // LỚP 1: BACKGROUND (Vẽ trước)
    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            if (imgs.ground) ctx.drawImage(imgs.ground, c*TILE, r*TILE, TILE, TILE);
            
            // Debug Grid mờ mờ để dễ căn chỉnh
            if (DEBUG_MODE) {
                ctx.strokeStyle = "rgba(255,255,255,0.05)";
                ctx.lineWidth = 1;
                ctx.strokeRect(c*TILE, r*TILE, TILE, TILE);
            }
        }
    }

    // LỚP 2: VẬT THỂ & DEBUG HITBOX (Vẽ đè lên)
    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
        if (map[r][c].val === 0) continue; // Ô trống, không vẽ gì
            const val = map[r][c].val;
            const x = c * TILE;
            const y = r * TILE;

            // Vẽ Tower (2x2 tile)
            if (val >= 1 && val <= 4) {
                let img = val === 4 ? imgs.tow4 : val === 3 ? imgs.tow3 : val === 2 ? imgs.tow2 : imgs.tow1;
                if (img) ctx.drawImage(img, x, y, TOWER_DRAW_SIZE, TOWER_DRAW_SIZE);

                // [DEBUG] Vẽ khung đỏ (Square Hitbox)
                if (DEBUG_MODE) {
                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, TOWER_DRAW_SIZE, TOWER_DRAW_SIZE);
                }
            }
            // Vẽ Tree viền (40x80 = 1x2 tile)
            else if (val === 10 && imgs.tree) {
                ctx.drawImage(imgs.tree, x, y, 40, 80);
                if (DEBUG_MODE) {
                    ctx.strokeStyle = "#00ff00";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, 40, 80);
                }
            }
            // Vẽ Bush (120x80 = 3x2 tile) với 4 biến thể 11..14
            else if (val >= 11 && val <= 14) {
                const bushIndex = val - 11; // 0..3
                const bushArray = [imgs.bush1, imgs.bush2, imgs.bush3, imgs.bush4];
                const img = bushArray[bushIndex];
                if (img) {
                    // Bụi luôn vẽ bình thường; không mờ theo người chơi
                    ctx.drawImage(img, x, y, 120, 80);
                }
                if (DEBUG_MODE) {
                    ctx.strokeStyle = "#00ccff";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, 120, 80);
                }
            }
        
        }
    }

    // LỚP 3: PICKUPS (vẽ sau các vật thể lớn để luôn hiển thị trên cùng)
    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            const val = map[r][c].val;
            if (val < 101 || val > 104) continue;
            const x = c * TILE;
            const y = r * TILE;
            let img: HTMLImageElement | undefined;
            if (val === 101) img = iconImgs.health;
            else if (val === 102) img = iconImgs.shield;
            else if (val === 103) img = iconImgs.speedBoost;
            else if (val === 104) img = iconImgs.damageBoost;
            if (img) {
                const size = PICKUP_ICON_SIZE; 
                const cx = Math.round(x + (TILE - size) / 2);
                const cy = Math.round(y + (TILE - size) / 2);
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(img, cx, cy, size, size);
            }
            if (DEBUG_MODE) {
                ctx.strokeStyle = "#ffaa00";
                ctx.strokeRect(x, y, TILE, TILE);
            }
        }
    }
   

    }
    export default drawMap;