"use client";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { tankBulletAnimation } from "../Animation/tankBulletAnimation";
import { tankGunAnimation } from "../Animation/tankGunAnimation";
import { tankMovingAnimation } from "../Animation/tankMovingAnimation";
import { TILE_SIZE, MAX_DPR } from "../GlobalSetting"; // Chỉ lấy TILE_SIZE, kích thước màn hình sẽ tự tính
import { useGameInput } from "../Hook/useGameInput";
import useLoadLazeBullet from "../Hook/useLoadLazeBullet";
import useLoadTankBody from "../Hook/useLoadTankBody";
import useLoadTankBullet from "../Hook/useLoadTankBullet";
import useLoadTankGun from "../Hook/useLoadTankGun";
import { useSocket } from "../Hook/useSocket";
import { Bullet, BulletAnimationState, BulletState } from "../Model/Bullet";
import { KeyMap } from "../Model/KeyMap";
import { MAP_COLS, MAP_ROWS, MapCell } from "../Model/MapData";
import { TankAnimationState, TankState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";
import { tankUpdatePosistion } from "../Position/tankUpdatePosition";
import { tankHealthAnimation } from "../Animation/tankHealthAnimation";
import useLoadTree from "../Hook/useLoadTree";
import useLoadBush from "../Hook/useLoadBush";
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
  const dprRef = useRef<number>(1);

  // //  LOAD ASSET ---
  const {imageRef:tankBodyImageRef,isImageLoaded} = useLoadTankBody()
  const {imageRef:tankGunImageRef,isImageLoaded:isGunImageLoaded} =  useLoadTankGun()
  const {imageRef:lazeImageRef,isImageLoaded:isLazeImageLoaded} =  useLoadLazeBullet()
  const {imageRef:bulletImageRef,isImageLoaded:isBulletImageLoaded} =  useLoadTankBullet()
  const {imageRef:treeImageRef,isImageLoaded:isTreeImageLoaded} =  useLoadTree()
  const {imageRef:bushImageRef,isImageLoaded:isBushImageLoaded} =  useLoadBush()
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
  useEffect(() => {
      const handleResize = () => {
          // Cập nhật kích thước viewport theo cửa sổ trình duyệt (không ép bội số/cố định)
          const wCss = window.innerWidth;
          const hCss = window.innerHeight;
          viewport.current = { w: wCss, h: hCss };
          dprRef.current = Math.max(1, Math.min(window.devicePixelRatio || 1, MAX_DPR));
          const canvas = canvasRef.current;
          if (canvas) {
            // Set style size theo CSS pixels
            canvas.style.width = `${wCss}px`;
            canvas.style.height = `${hCss}px`;
            // Kích thước buffer theo device pixels (sắc nét) - dùng ceil để không hụt 1px
            canvas.width = Math.ceil(wCss * dprRef.current);
            canvas.height = Math.ceil(hCss * dprRef.current);
          }
      };
      handleResize(); // Gọi ngay lần đầu để khớp 100vw/100vh
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  console.log(tankStateRef.current);
  // Chặn Ctrl+wheel (zoom) và pinch gesture
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    const onGesture = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    // Safari iOS gesture events
    window.addEventListener('gesturestart', onGesture as EventListener, { passive: false });
    window.addEventListener('gesturechange', onGesture as EventListener, { passive: false });
    window.addEventListener('gestureend', onGesture as EventListener, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel as EventListener);
      window.removeEventListener('gesturestart', onGesture as EventListener);
      window.removeEventListener('gesturechange', onGesture as EventListener);
      window.removeEventListener('gestureend', onGesture as EventListener);
    };
  }, []);
  //  SOCKET LISTENERS ---
  useEffect(() => {
    if (socket && isConnected) {
      // Prefer combined state packet; keep legacy listeners for compatibility
      socket.on('state', (payload: { tankState: any; bulletState: any }) => {
        if (payload?.tankState) tankStateRef.current = payload.tankState;
        if (payload?.bulletState) bulletStateRef.current = payload.bulletState;
      });
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
          socket.off('state');
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
  ) => tankMovingAnimation(ctx,tankState,tankAnimationState,keysPressed,frames, socket?.id),[isImageLoaded, socket?.id])

  // Animation cho tank gun
  const tankGunAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    tankState: RefObject<TankState>,
    tankGunAnimationState: RefObject<TankGunAnimationState>,
    keysPressed: RefObject<KeyMap>,
    frames: RefObject<HTMLImageElement[]>,
  ) => tankGunAnimation(ctx,tankState,tankGunAnimationState,keysPressed,frames, socket?.id),[isGunImageLoaded, socket?.id])

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
    bushImg: RefObject<HTMLImageElement[]>,
    ctx: CanvasRenderingContext2D
  ) => {
    const my = socket?.id ? tankStateRef.current.tankStates[socket.id] : null;
    const myBushRoot = my?.inBush && my?.bushRootR !== undefined && my?.bushRootC !== undefined
      ? { r: my.bushRootR, c: my.bushRootC }
      : undefined;
    drawMap(camX,camY,dynamicMap,viewPort,groundImg,treeImg,towerImg,bushImg,ctx, myBushRoot)
  },[isGroundImageLoaded,isTreeImageLoaded,isTowerImageLoaded,isBushImageLoaded, socket?.id])


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

    // Thiết lập scale theo devicePixelRatio để hình ảnh sắc nét trên màn hình DPI cao
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);

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

        // 2. Giới hạn Camera (không vượt quá biên trái/trên và phải/dưới)
        // Thêm TILE_SIZE padding để đảm bảo hiển thị trọn cả khi screen không phải bội số 40
        camX = Math.max(0, camX);
        camY = Math.max(0, camY);
        
        if (MAP_REAL_W > viewport.current.w) {
            camX = Math.min(camX, MAP_REAL_W - viewport.current.w + 7.2 * TILE_SIZE);
        }
        if (MAP_REAL_H > viewport.current.h) {
            camY = Math.min(camY, MAP_REAL_H - viewport.current.h + 4.1 * TILE_SIZE);
        }
    }    // --- VẼ THẾ GIỚI TRONG KHU VỰC VIEWPORT 100% ---
    ctx.save();
    ctx.translate(-camX, -camY); // Dịch chuyển thế giới

    drawMapCB(camX, camY, viewport, dynamicMap, groundImageRef, treeImageRef, towerRef, bushImageRef, ctx);
    tankUpdatePosistion(keysPressed, tankGunAnimationState, socket); // Cập nhật vị trí tank dựa trên phím nhấn và gửi lên server
    tankMovingAnimationCB(ctx, tankStateRef, tankAnimationState, keysPressed, tankBodyImageRef);
    tankGunAnimationCB(ctx, tankStateRef, tankGunAnimationState, keysPressed, tankGunImageRef);
    tankBulletAnimationCB(ctx, bulletStateRef, bulletAnimationState, bulletImageRef);
    tankHealthAnimation(ctx, tankStateRef, keysPressed);

    ctx.restore();

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
        className="bg-gray-900 block touch-none w-screen h-screen" // block để xóa dòng trắng, touch-none để tránh scroll trên mobile
    />
  );
}

export default Game;