"use client";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { tankBulletAnimation } from "../Animation/tankBulletAnimation";
import { tankGunAnimation } from "../Animation/tankGunAnimation";
import { tankMovingAnimation } from "../Animation/tankMovingAnimation";
import { TILE_SIZE } from "../GlobalSetting"; // Chỉ lấy TILE_SIZE, kích thước màn hình sẽ tự tính
import { useGameInput } from "../Hook/useGameInput";
import useLoadLazeBullet from "../Hook/useLoadLazeBullet";
import useLoadTankBody from "../Hook/useLoadTankBody";
import useLoadTankBullet from "../Hook/useLoadTankBullet";
import useLoadTankGun from "../Hook/useLoadTankGun";
import { useSocket } from "../Hook/useSocket";
import { Bullet, BulletAnimationState, BulletState } from "../Model/Bullet";
import { KeyMap } from "../Model/KeyMap";
import { INITIAL_MAP, MAP_COLS, MAP_ROWS, MapCell } from "../Model/MapData";
import { Tank, TankAnimationState, TankState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";
import { tankUpdatePosistion } from "../Position/tankUpdatePosition";
import { tankHealthAnimation } from "../Animation/tankHealthAnimation";
import { start } from "repl";
import useLoadTree from "../Hook/useLoadTree";
import drawMap from "../Animation/drawMap";
import useLoadGround from "../Hook/useLoadGround";
import useLoadTower from "../Hook/useLoadTower";

// --- BẬT DEBUG MODE: True để hiện khung va chạm ---
const DEBUG_MODE = true; 

function Game() {
  // --- STATE GAME ---
  const tankStateRef = useRef<TankState>({ serverTimestamp: 0, tankStates: {} });
  const bulletStateRef = useRef<BulletState>({ serverTimestamp: 0, bulletStates: {} });
  const dynamicMap= useRef<MapCell[][]>([]);
  
  // --- STATE MÀN HÌNH (VIEWPORT) ---
  const viewport = useRef({ w: 1200, h: 800 });

  const { socket, isConnected } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(null);

  // //  LOAD ASSET ---
  const {imageRef:tankBodyImageRef,isImageLoaded} = useLoadTankBody()
  const {imageRef:tankGunImageRef,isImageLoaded:isGunImageLoaded} =  useLoadTankGun()
  const {imageRef:lazeImageRef,isImageLoaded:isLazeImageLoaded} =  useLoadLazeBullet()
  const {imageRef:bulletImageRef,isImageLoaded:isBulletImageLoaded} =  useLoadTankBullet()
  const {imageRef:treeImageRef,isImageLoaded:isTreeImageLoaded} =  useLoadTree()
  const {imageRef:groundImageRef,isImageLoaded:isGroundImageLoaded} =  useLoadGround()
  const {imageRef:towerRef,isImageLoaded:isTowerImageLoaded} =  useLoadTower()
  
   const mapAssetsRef = useRef<any>({});

  const bulletsRef = useRef<Bullet[]>([]);
  // Ref để theo dõi trạng thái các phím W A S D đang được nhấn
  const keysPressed = useGameInput()

  //  TAO ANIMATION STATE DE RENDER ANIMATION ---
  // Ref để lưu trữ trạng thái hoạt ảnh di chuyen của tank
  const tankAnimationState = useRef<TankAnimationState>({})
  // Ref để lưu trữ trạng thái hoạt ảnh bắn của tank
  const tankGunAnimationState = useRef<TankGunAnimationState>({})
  // Ref để lưu trữ trạng thái hoạt ảnh đạn
  const bulletAnimationState = useRef<BulletAnimationState>({})

   // useEffect để khởi tạo, chạy hoạt ảnh và gắn event listeners
  //  XỬ LÝ RESIZE MÀN HÌNH ---
  // useEffect(() => {
  //     const handleResize = () => {
  //         // Cập nhật kích thước canvas theo cửa sổ trình duyệt
  //         viewport({ w: window.innerWidth, h: window.innerHeight });
  //     };
  //     handleResize(); // Gọi ngay lần đầu
  //     window.addEventListener('resize', handleResize);
  //     return () => window.removeEventListener('resize', handleResize);
  // }, []);

  console.log(tankStateRef.current);
  //  SOCKET LISTENERS ---
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('tankState', (s) => tankStateRef.current = s);
      socket.on('bulletState', (s) => bulletStateRef.current = s);

      
      // Nhận Map ban đầu
      socket.on('mapData', ({ map }) => dynamicMap.current = map);
      
      // Nhận cập nhật Map (khi tường vỡ)
      socket.on('mapUpdate', ({ r, c, cell }) => {
        console.log("Map update received:", r, c, cell);
          dynamicMap.current[r][c] = cell;
      });
      return () => { 
          socket.off('tankState'); socket.off('bulletState'); 
          socket.off('mapData'); socket.off('mapUpdate'); 
      };
    }
  }, [socket, isConnected]);

  //  ANIMATION FUNCTIONS---
  // Animation cho tank di chuyen
  const tankMovingAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    tankState: RefObject<TankState>,
    tankAnimationState: RefObject<TankAnimationState>,
    keysPressed: RefObject<KeyMap>,
    frames: RefObject<HTMLImageElement[]>,
  ) => tankMovingAnimation(ctx,tankState,tankAnimationState,keysPressed,frames),[isImageLoaded])

  // Animation cho tank gun
  const tankGunAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    tankState: RefObject<TankState>,
    tankGunAnimationState: RefObject<TankGunAnimationState>,
    keysPressed: RefObject<KeyMap>,
    frames: RefObject<HTMLImageElement[]>,
  ) => tankGunAnimation(ctx,tankState,tankGunAnimationState,keysPressed,frames),[isGunImageLoaded])

  // Animation cho đạn
  const tankBulletAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    bulletState: RefObject<BulletState>,
    bulletAnimationState: RefObject<BulletAnimationState>,
    frames: RefObject<HTMLImageElement[]>
  ) => tankBulletAnimation(ctx,bulletState,bulletAnimationState,frames),[isBulletImageLoaded])

  const tankUpdatePosistionCB = useCallback((
    keysPressed: RefObject<KeyMap>,
    tankGunAnimationState: RefObject<TankGunAnimationState>,
    socket: any,
  ) => tankUpdatePosistion(keysPressed,tankGunAnimationState,socket),[])

  // draw map 
  const drawMapCB = useCallback((
    camX:number,
    camY:number,
    viewPort: RefObject<{ w: number; h: number }>,
    dynamicMap: RefObject<MapCell[][]>,
    groundImg: RefObject<HTMLImageElement[]>,
    treeImg: RefObject<HTMLImageElement[]>,
    towerImg: RefObject<HTMLImageElement[]>,
    ctx: CanvasRenderingContext2D
  ) => {
    drawMap(camX,camY,dynamicMap,viewPort,groundImg,treeImg,towerImg,ctx)
  },[isGroundImageLoaded,isTreeImageLoaded,isTowerImageLoaded])


  // --- 3. LOAD ASSETS ---
 
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
    ctx.fillRect(0, 0, viewport.current.w, viewport.current.h);
    
    const myTank = socket?.id ? tankStateRef.current.tankStates[socket.id] : null;
    
    // --- LOGIC CAMERA CLAMP (GIỚI HẠN GÓC) ---
    let camX = 0, camY = 0;
    
    // Kích thước thật của Map (80 ô * 40px = 3200px)
    const MAP_REAL_W = MAP_COLS * TILE_SIZE;
    const MAP_REAL_H = MAP_ROWS * TILE_SIZE;

    if (myTank) { 
        // 1. Tính vị trí muốn camera đến (Tank ở giữa)
        camX = myTank.x - viewport.current.w / 2;
        camY = myTank.y - viewport.current.h / 2; 

        // 2. Giới hạn (Clamp)
        // Không nhỏ hơn 0
        camX = Math.max(0, camX);
        camY = Math.max(0, camY);
        
        // Không lớn hơn (Kích thước Map - Kích thước Màn hình)
        // (Chỉ clamp nếu map lớn hơn màn hình)
        if (MAP_REAL_W > viewport.current.w) {
            camX = Math.min(camX, MAP_REAL_W - viewport.current.w);
        }
        if (MAP_REAL_H > viewport.current.h) {
            camY = Math.min(camY, MAP_REAL_H - viewport.current.h);
        }
    }

    ctx.save();
    ctx.translate(-camX, -camY); // Dịch chuyển thế giới

   drawMapCB(camX, camY, viewport, dynamicMap, groundImageRef, treeImageRef, towerRef, ctx);
    tankUpdatePosistion(keysPressed, tankGunAnimationState, socket); // Cập nhật vị trí tank dựa trên phím nhấn và gửi lên server
    tankMovingAnimationCB(ctx, tankStateRef, tankAnimationState, keysPressed, tankBodyImageRef);
    tankGunAnimationCB(ctx, tankStateRef, tankGunAnimationState, keysPressed, tankGunImageRef);
    tankBulletAnimationCB(ctx, bulletStateRef, bulletAnimationState, bulletImageRef);
    tankHealthAnimation(ctx, tankStateRef, keysPressed);
    
    ctx.restore(); // Khôi phục để vẽ UI cố định

    // UI Debug (Vẽ đè lên trên cùng)
    if (DEBUG_MODE) {
        ctx.fillStyle = "yellow";
        ctx.font = "14px Arial";
        ctx.fillText(`DEBUG MODE ON`, 20, 30);
        ctx.fillText(`Tank: ${Math.round(myTank?.x || 0)}, ${Math.round(myTank?.y || 0)}`, 20, 50);
        ctx.fillText(`Cam: ${Math.round(camX)}, ${Math.round(camY)}`, 20, 70);
        ctx.fillText(`Screen: ${viewport.current.w} x ${viewport.current.h}`, 20, 90);
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
        width={viewport.current.w} 
        height={viewport.current.h} 
        className="bg-gray-900 block touch-none" // block để xóa dòng trắng, touch-none để tránh scroll trên mobile
        style={{ width: '100vw', height: '100vh' }} 
    />
  );
}

export default Game;