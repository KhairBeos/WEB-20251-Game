import { RefObject } from "react";
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
    ctx: CanvasRenderingContext2D) => {
   
    if (dynamicMap.current.length === 0) return;
    const map = dynamicMap.current
    const imgs = {
        ground: groundImg.current[0],
        tree: treeImg.current[0],
        tow4: towerImg.current[0],
        tow3: towerImg.current[1],
        tow2: towerImg.current[2],
        tow1: towerImg.current[3],

    }
    const DEBUG_MODE = false; // Bật tắt debug hitbox
   
    const TILE = 40; // Base unit

    // Tính toán ô bắt đầu và kết thúc dựa trên vị trí camera và kích thước viewport
    var startCol = Math.floor(camX / TILE);
    var endCol = Math.min(MAP_COLS - 1, Math.floor((camX + viewport.current.w) / TILE));
    var startRow = Math.floor(camY / TILE);
    var endRow =  Math.min(MAP_ROWS - 1, Math.floor((camY + viewport.current.h) / TILE));
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

            // Vẽ Tower (80x80)
            if (val >= 1 && val <= 4) {
                let img = val === 4 ? imgs.tow4 : val === 3 ? imgs.tow3 : val === 2 ? imgs.tow2 : imgs.tow1;
                if (img) ctx.drawImage(img, x, y, 80, 80);

                // [DEBUG] Vẽ khung đỏ (Square Hitbox)
                if (DEBUG_MODE) {
                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, 80, 80);
                }
            }
            // Vẽ Tree (120x120)
            else if (val === 10 && imgs.tree) {
                ctx.drawImage(imgs.tree, x, y, 120, 120);

                // [DEBUG] Vẽ vòng tròn xanh (Circle Hitbox)
                if (DEBUG_MODE) {
                    ctx.strokeStyle = "#00ff00"; 
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    // Tâm cây: x + 1.5 ô (40*1.5 = 60)
                    ctx.arc(x + 60, y + 60, 50, 0, 2 * Math.PI); 
                    ctx.stroke();
                }
            }
            
        }
    }
    }
    export default drawMap;