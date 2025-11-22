"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { tankBulletAnimation } from "../Animation/tankBulletAnimation";
import { tankGunAnimation } from "../Animation/tankGunAnimation";
import { tankMovingAnimation } from "../Animation/tankMovingAnimation";
import { useGameInput } from "../Hook/useGameInput";
import useLoadLazeBullet from "../Hook/useLoadLazeBullet";
import useLoadTankBody from "../Hook/useLoadTankBody";
import useLoadTankBullet from "../Hook/useLoadTankBullet";
import useLoadTankGun from "../Hook/useLoadTankGun";
import { useSocket } from "../Hook/useSocket";
import { BulletAnimationState, BulletState } from "../Model/Bullet";
import { TankAnimationState, TankState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";
import { tankUpdatePosistion } from "../Position/tankUpdatePosition";
import { TILE_SIZE } from "../GlobalSetting"; // Chỉ lấy TILE_SIZE, kích thước màn hình sẽ tự tính
import { INITIAL_MAP, MAP_COLS, MAP_ROWS } from "../Model/MapData"; 

// --- BẬT DEBUG MODE: True để hiện khung va chạm ---
const DEBUG_MODE = true; 

function Game() {
  // --- STATE GAME ---
  const tankStateRef = useRef<TankState>({ serverTimestamp: 0, tankStates: {} });
  const bulletStateRef = useRef<BulletState>({ serverTimestamp: 0, bulletStates: {} });
  const [dynamicMap, setDynamicMap] = useState<number[][]>([]);
  
  // --- STATE MÀN HÌNH (VIEWPORT) ---
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });

  const { socket, isConnected } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(null);

  // --- 1. XỬ LÝ RESIZE MÀN HÌNH ---
  useEffect(() => {
      const handleResize = () => {
          // Cập nhật kích thước canvas theo cửa sổ trình duyệt
          setViewport({ w: window.innerWidth, h: window.innerHeight });
      };
      handleResize(); // Gọi ngay lần đầu
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 2. SOCKET LISTENERS ---
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('tankState', (s) => tankStateRef.current = s);
      socket.on('bulletState', (s) => bulletStateRef.current = s);
      
      // Nhận Map ban đầu
      socket.on('mapData', ({ map }) => setDynamicMap(map));
      
      // Nhận cập nhật Map (khi tường vỡ)
      socket.on('mapUpdate', ({ r, c, val }) => {
         setDynamicMap(prev => {
             if (prev.length === 0) return prev;
             const newMap = [...prev];
             newMap[r] = [...prev[r]];
             newMap[r][c] = val;
             return newMap;
         });
      });
      return () => { 
          socket.off('tankState'); socket.off('bulletState'); 
          socket.off('mapData'); socket.off('mapUpdate'); 
      };
    }
  }, [socket, isConnected]);

  // --- 3. LOAD ASSETS ---
  const { imageRef: tankBodyImageRef, isImageLoaded } = useLoadTankBody();
  const { imageRef: tankGunImageRef, isImageLoaded: isGunImageLoaded } = useLoadTankGun();
  const { imageRef: bulletImageRef, isImageLoaded: isBulletImageLoaded } = useLoadTankBullet();
  const { imageRef: lazeImageRef, isImageLoaded: isLazeImageLoaded } = useLoadLazeBullet();
  const mapAssetsRef = useRef<any>({});
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    const sources = {
        ground: '/map/ground.png', tree: '/map/tree.png',
        tow4: '/map/tower_4.png', tow3: '/map/tower_3.png',
        tow2: '/map/tower_2.png', tow1: '/map/tower_1.png',
    };
    let cnt = 0;
    const total = Object.keys(sources).length;
    const assets: any = {};
    Object.entries(sources).forEach(([key, src]) => {
        const img = new Image(); img.src = src;
        img.onload = () => { assets[key] = img; cnt++; if (cnt === total) { mapAssetsRef.current = assets; setIsMapLoaded(true); } };
    });
  }, []);

  const keysPressed = useGameInput();
  const tankAnimationState = useRef<TankAnimationState>({});
  const tankGunAnimationState = useRef<TankGunAnimationState>({});
  const bulletAnimationState = useRef<BulletAnimationState>({});

  // Callbacks animation (Giữ nguyên)
  const tankMovingAnimationCB = useCallback((ctx: any, s: any, a: any, k: any, f: any) => tankMovingAnimation(ctx, s, a, k, f), [isImageLoaded]);
  const tankGunAnimationCB = useCallback((ctx: any, s: any, a: any, k: any, f: any) => tankGunAnimation(ctx, s, a, k, f), [isGunImageLoaded]);
  const tankBulletAnimationCB = useCallback((ctx: any, s: any, a: any, f: any) => tankBulletAnimation(ctx, s, a, f), [isBulletImageLoaded]);
  const tankUpdatePosistionCB = useCallback((k: any, s: any) => tankUpdatePosistion(k, s), []);

  // --- 4. HÀM VẼ MAP ---
  const drawMap = useCallback((ctx: CanvasRenderingContext2D) => {
    const map = dynamicMap.length > 0 ? dynamicMap : INITIAL_MAP;
    const imgs = mapAssetsRef.current;
    const TILE = 40; // Base unit

    // LỚP 1: BACKGROUND (Vẽ trước)
    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[0].length; c++) {
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
    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[0].length; c++) {
            const val = map[r][c];
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
            // [DEBUG] Vẽ ô Block ảo (99)
            else if (val === 99 && DEBUG_MODE) {
                 ctx.fillStyle = "rgba(255, 0, 0, 0.1)"; // Đỏ nhạt
                 ctx.fillRect(x, y, TILE, TILE);
            }
        }
    }
  }, [dynamicMap]);

  // --- 5. GAME LOOP (ANIMATE) ---
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isImageLoaded || !isMapLoaded) { 
        animationFrameId.current = requestAnimationFrame(animate); 
        return; 
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Xóa màn hình theo kích thước viewport
    ctx.fillStyle = "#2d3436"; 
    ctx.fillRect(0, 0, viewport.w, viewport.h);
    
    const myTank = socket?.id ? tankStateRef.current.tankStates[socket.id] : null;
    
    // --- LOGIC CAMERA CLAMP (GIỚI HẠN GÓC) ---
    let camX = 0, camY = 0;
    
    // Kích thước thật của Map (80 ô * 40px = 3200px)
    const MAP_REAL_W = MAP_COLS * TILE_SIZE;
    const MAP_REAL_H = MAP_ROWS * TILE_SIZE;

    if (myTank) { 
        // 1. Tính vị trí muốn camera đến (Tank ở giữa)
        camX = myTank.x - viewport.w / 2;
        camY = myTank.y - viewport.h / 2; 

        // 2. Giới hạn (Clamp)
        // Không nhỏ hơn 0
        camX = Math.max(0, camX);
        camY = Math.max(0, camY);
        
        // Không lớn hơn (Kích thước Map - Kích thước Màn hình)
        // (Chỉ clamp nếu map lớn hơn màn hình)
        if (MAP_REAL_W > viewport.w) {
            camX = Math.min(camX, MAP_REAL_W - viewport.w);
        }
        if (MAP_REAL_H > viewport.h) {
            camY = Math.min(camY, MAP_REAL_H - viewport.h);
        }
    }

    ctx.save();
    ctx.translate(-camX, -camY); // Dịch chuyển thế giới

    drawMap(ctx); // Vẽ map trước
    tankUpdatePosistionCB(keysPressed, socket);
    tankMovingAnimationCB(ctx, tankStateRef, tankAnimationState, keysPressed, tankBodyImageRef);
    tankGunAnimationCB(ctx, tankStateRef, tankGunAnimationState, keysPressed, tankGunImageRef);
    tankBulletAnimationCB(ctx, bulletStateRef, bulletAnimationState, bulletImageRef);
    
    ctx.restore(); // Khôi phục để vẽ UI cố định

    // UI Debug (Vẽ đè lên trên cùng)
    if (DEBUG_MODE) {
        ctx.fillStyle = "yellow";
        ctx.font = "14px Arial";
        ctx.fillText(`DEBUG MODE ON`, 20, 30);
        ctx.fillText(`Tank: ${Math.round(myTank?.x || 0)}, ${Math.round(myTank?.y || 0)}`, 20, 50);
        ctx.fillText(`Cam: ${Math.round(camX)}, ${Math.round(camY)}`, 20, 70);
        ctx.fillText(`Screen: ${viewport.w} x ${viewport.h}`, 20, 90);
    }
    
    animationFrameId.current = requestAnimationFrame(animate);
  }, [isImageLoaded, isGunImageLoaded, isMapLoaded, drawMap, socket, viewport, tankMovingAnimationCB, tankGunAnimationCB, tankBulletAnimationCB, tankUpdatePosistionCB]);

  useEffect(() => {
    if (isImageLoaded) animationFrameId.current = requestAnimationFrame(animate);
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [animate, isImageLoaded]);

  // Canvas full màn hình, không viền thừa
  return (
    <canvas 
        ref={canvasRef} 
        width={viewport.w} 
        height={viewport.h} 
        className="bg-gray-900 block touch-none" // block để xóa dòng trắng, touch-none để tránh scroll trên mobile
        style={{ width: '100vw', height: '100vh' }} 
    />
  );
}

export default Game;