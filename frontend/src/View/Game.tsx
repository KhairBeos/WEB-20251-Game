"use client";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import drawMap from "../Animation/drawMap";
import { useRouter } from "next/navigation";
import { tankBulletAnimation } from "../Animation/tankBulletAnimation";
import { tankGunAnimation } from "../Animation/tankGunAnimation";
import { tankHealthAnimation } from "../Animation/tankHealthAnimation";
import { tankMovingAnimation } from "../Animation/tankMovingAnimation";
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEBUG_MODE, MAX_DPR, TILE_SIZE } from "../GlobalSetting"; // Chỉ lấy TILE_SIZE, kích thước màn hình sẽ tự tính
import { useGameInput } from "../Hook/useGameInput";import { useTouchInput } from "../Hook/useTouchInput";import useLoadBush from "../Hook/useLoadBush";
import useLoadGround from "../Hook/useLoadGround";
import useLoadTankBody from "../Hook/useLoadTankBody";
import useLoadTankBullet from "../Hook/useLoadTankBullet";
import useLoadTankGun from "../Hook/useLoadTankGun";
import useLoadTower from "../Hook/useLoadTower";
import useLoadTree from "../Hook/useLoadTree";
import { useSocket } from "../Hook/useSocket";
import { Bullet, BulletAnimationState, BulletState } from "../Model/Bullet";
import { KeyMap } from "../Model/KeyMap";
import { MAP_COLS, MAP_ROWS, MapCell } from "../Model/MapData";
import { TankAnimationState, TankState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";
import { tankUpdatePosistion } from "../Position/tankUpdatePosition";
import Scoreboard from "./Scoreboard";
import MobileDPad from "../Component/MobileDPad";

// --- BẬT DEBUG MODE: True để hiện khung va chạm ---
import useLoadMapIcons from "../Hook/useLoadMapIcons";
import useLoadItem from "../Hook/useLoadTankFeatures";
import { SoundState } from "../Model/Sound";

interface GameProps {
  playerName: string;
}

function Game({ playerName }: GameProps) {
  const router = useRouter();

  // --- STATE GAME ---
  const [isGameOver, setIsGameOver] = useState(false);
  const tankStateRef = useRef<TankState>({ serverTimestamp: 0, tankStates: {} });
  const bulletStateRef = useRef<BulletState>({ serverTimestamp: 0, bulletStates: {} });
  const dynamicMap= useRef<MapCell[][]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  const lastCamPos = useRef({ x: 0, y: 0 });
  
  // --- STATE MÀN HÌNH (VIEWPORT) ---
  const viewport = useRef({ w: 1200, h: 800 });

  const { socket, isConnected } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(null);
  const dprRef = useRef<number>(1);

  // //  LOAD ASSET ---
  const {imageRef:tankBodyImageRef,isImageLoaded} = useLoadTankBody()
  const {imageRef:tankGunImageRef,isImageLoaded:isGunImageLoaded} =  useLoadTankGun()
  
  const {imageRef:bulletImageRef,isImageLoaded:isBulletImageLoaded} =  useLoadTankBullet()
  const {imageRef:treeImageRef,isImageLoaded:isTreeImageLoaded} =  useLoadTree()
  const {imageRef:bushImageRef,isImageLoaded:isBushImageLoaded} =  useLoadBush()
  const {imageRef:groundImageRef,isImageLoaded:isGroundImageLoaded} =  useLoadGround()
  const {imageRef:towerRef,isImageLoaded:isTowerImageLoaded} =  useLoadTower()
  const {imageRef:itemRef,isImageLoaded:isItemImageLoaded} = useLoadItem()
  const {images:mapIcons,isImageLoaded:isMapIconsLoaded} = useLoadMapIcons()

  // LOAD SOUND (khởi tạo trong browser để tránh SSR ReferenceError)
  const fireSoundRef = useRef<HTMLAudioElement | null>(null);
  const hitSoundRef = useRef<HTMLAudioElement | null>(null);
  const itemSoundRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    fireSoundRef.current = new Audio('/sound/FireSound.mp3');
    hitSoundRef.current = new Audio('/sound/onHitSound.mp3');
    itemSoundRef.current = new Audio('/sound/ItemSound.mp3');
    backgroundMusicRef.current = new Audio('/sound/backGroundSound.mp3');
  }, []);

  // --- TẠO CÁC REF LƯU TRẠNG THÁI ---
  // Ref để theo dõi trạng thái tank từ server
  
  const mapAssetsRef = useRef<any>({});
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const needsStaticRedrawRef = useRef<boolean>(true);

  const bulletsRef = useRef<Bullet[]>([]);
  // Ref để theo dõi trạng thái các phím W A S D đang được nhấn
  const keysPressed = useGameInput();
  const touchInput = useTouchInput();

  //  TAO ANIMATION STATE DE RENDER ANIMATION ---
  // Ref để lưu trữ trạng thái hoạt ảnh di chuyen của tank
  const tankAnimationState = useRef<TankAnimationState>({})
  // Ref để lưu trữ trạng thái hoạt ảnh bắn của tank
  const tankGunAnimationState = useRef<TankGunAnimationState>({})
  // Ref để lưu trữ trạng thái hoạt ảnh đạn
  const bulletAnimationState = useRef<BulletAnimationState>({})
  // useEffect để khởi tạo, chạy hoạt ảnh và gắn event listeners
  const isAllAssetsLoaded = isImageLoaded && isGunImageLoaded  && isBulletImageLoaded && isTreeImageLoaded && isBushImageLoaded && isGroundImageLoaded && isTowerImageLoaded && isItemImageLoaded && isMapIconsLoaded;

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
      
      socket.on('tankState', (s) => tankStateRef.current = s);
      socket.on('bulletState', (s) => bulletStateRef.current = s);
      socket.on('fireBullet', (playerId) => {
        tankGunAnimationState.current[playerId].isFiring = true;
      })
      socket.on('hitTank', (playerId) => {
        tankAnimationState.current[playerId].onHit.isOnHit = true;
      });
      // Nhận Map ban đầu
      socket.on('mapData', ({ map }) => { dynamicMap.current = map; needsStaticRedrawRef.current = true; });
      
      // Nhận cập nhật Map (khi tường vỡ)
      socket.on('mapUpdate', ({ r, c, cell }) => {
        if (!dynamicMap.current || !dynamicMap.current[r]) {
              return; 
          }
        console.log("Map update received:", r, c, cell);
          dynamicMap.current[r][c] = cell;
          needsStaticRedrawRef.current = true;
      });

      socket.on('gameOver', (playerId) => {
          if(playerId !== socket.id) return;
          setIsGameOver(true); // Hiện màn hình chết 

          setTimeout(() => {
              router.push('/'); 
          }, 3000);
      });

      socket.on('sessionRestored', (data) => {
          console.log("Đã khôi phục phiên chơi:", data);
      });

      if (playerName) {
          console.log("Gửi lệnh RegisterName:", playerName);
          socket.emit('registerName', { name: playerName });
      }

      return () => { 
          socket.off('tankState'); socket.off('bulletState'); 
          socket.off('mapData'); socket.off('mapUpdate'); 
          socket.off('gameOver'); socket.off('sessionRestored');
      };
    }
  }, [socket, isConnected, playerName, router]);

  useEffect(() => {
      const interval = setInterval(() => {
          if (tankStateRef.current && tankStateRef.current.tankStates) {
              // Chuyển từ Object {id: tank} sang Array [tank, tank]
              const playersArray = Object.values(tankStateRef.current.tankStates);
              setLeaderboardData(playersArray);
          }
      }, 1000); // 1000ms = 1 giây update 1 lần

      return () => clearInterval(interval);
  }, []);

  //  ANIMATION FUNCTIONS---
  // Animation cho tank di chuyen
  const tankMovingAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    tankState: RefObject<TankState>,
    tankAnimationState: RefObject<TankAnimationState>,
    keysPressed: RefObject<KeyMap>,
    frames: RefObject<HTMLImageElement[]>,
  ) => tankMovingAnimation(ctx,tankState,tankAnimationState,keysPressed,frames, socket?.id, hitSoundRef),[isImageLoaded, socket?.id,hitSoundRef])

  // Animation cho tank gun
  const tankGunAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    tankState: RefObject<TankState>,
    tankGunAnimationState: RefObject<TankGunAnimationState>,
    keysPressed: RefObject<KeyMap>,
    frames: RefObject<HTMLImageElement[]>,
  ) => tankGunAnimation(ctx,tankState,tankGunAnimationState,keysPressed,frames, socket?.id, fireSoundRef),[isGunImageLoaded, socket?.id, fireSoundRef])

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
    touchInput?: any,
    tankState?: any,
  ) => tankUpdatePosistion(keysPressed, tankGunAnimationState, socket, touchInput, tankState), [])

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
    icons: typeof mapIcons,
    ctx: CanvasRenderingContext2D,
    options?: { drawStatic?: boolean; drawPickups?: boolean; paddingTiles?: number }
  ) => {
    
    drawMap(camX,camY,dynamicMap,viewPort,groundImg,treeImg,towerImg,bushImg,icons,ctx, options)
  },[isGroundImageLoaded,isTreeImageLoaded,isTowerImageLoaded,isBushImageLoaded,isMapIconsLoaded, socket?.id])

      const rebuildStaticLayer = useCallback(() => {
        if (!isGroundImageLoaded || !isTreeImageLoaded || !isTowerImageLoaded || !isBushImageLoaded) return;
        if (!dynamicMap.current.length) return;
        const mapRows = dynamicMap.current.length;
        const mapCols = dynamicMap.current[0]?.length || 0;
        const width = mapCols * TILE_SIZE;
        const height = mapRows * TILE_SIZE;
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const offCtx = offscreen.getContext('2d');
        if (!offCtx) return;
        const fullViewport = { current: { w: width, h: height } } as RefObject<{ w: number; h: number }>;
        drawMap(0, 0, dynamicMap, fullViewport, groundImageRef, treeImageRef, towerRef, bushImageRef, mapIcons, offCtx, { drawStatic: true, drawPickups: false, paddingTiles: 0 });
        staticCanvasRef.current = offscreen;
        needsStaticRedrawRef.current = false;
      }, [drawMap, dynamicMap, groundImageRef, treeImageRef, towerRef, bushImageRef, mapIcons, isGroundImageLoaded, isTreeImageLoaded, isTowerImageLoaded, isBushImageLoaded]);

  const tankHealthAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    tankState: RefObject<TankState>,
    itemImages: RefObject<HTMLImageElement[]>,
  ) => tankHealthAnimation(ctx,tankState, itemImages, socket?.id, itemSoundRef),[isItemImageLoaded])


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

  // sound state
  const soundStateRef = useRef<SoundState>({});

  function gameSound() {
    const myTank = socket?.id ? tankStateRef.current.tankStates[socket.id] : null;
    if(!myTank) return;

    // Tìm các tank có trong màn hình
    for (const pid in tankStateRef.current.tankStates) {
      // if(pid === socket?.id) continue; // bỏ qua tank của mình
      const p = tankStateRef.current.tankStates[pid];
      const distX = p.x - myTank.x;
      const distY = p.y - myTank.y;
      const distSq = distX * distX + distY * distY;
      const hearingRadius = 400;
      if(soundStateRef.current[pid] === undefined) {
        soundStateRef.current[pid] = {
          fireSound: false,
          itemSound: false,
        };
      }
      const soundState = soundStateRef.current[pid];
      if (distSq <= hearingRadius * hearingRadius) {
        if(soundState.itemSound == false && p.itemKind !== "none") {
          console.log("Play item sound for player ", pid);
          itemSoundRef?.current?.play();
          soundState.itemSound = true;
        }
      }
      // reset 
      if(p.itemKind === "none") {
        soundState.itemSound = false;
      }
    }

    // Chạy nhạc nền
    if(backgroundMusicRef && backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = 0.2;
      backgroundMusicRef.current.loop = true;
      if(backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.play();
      }
    }
}


  // --- 5. GAME LOOP (ANIMATE) ---
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isImageLoaded || !isMapLoaded || !isMapIconsLoaded) { 
        animationFrameId.current = requestAnimationFrame(animate); 
        return; 
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- DPI + world scaling ---
    // We keep high-DPI buffer and optionally scale the world so that
    // small screens 'zoom out' to show similar world area.
    const DESIGN_VIEW_W = 1200; // target virtual viewport width (world units)
    const DESIGN_VIEW_H = 800;  // target virtual viewport height
    // Base device pixel ratio transform
    const baseDpr = dprRef.current;
    // Raw CSS-pixel viewport (before world scaling)
    const rawViewW = canvas.width / baseDpr;
    const rawViewH = canvas.height / baseDpr;
    // Compute a world scale so that on small screens we show more of the world
    const worldScale = Math.min(1, rawViewW / DESIGN_VIEW_W, rawViewH / DESIGN_VIEW_H);
    // Apply combined transform (DPR * worldScale) for crisp rendering + zoom
    ctx.setTransform(baseDpr * worldScale, 0, 0, baseDpr * worldScale, 0, 0);

    // Effective viewport in world pixels (what the camera sees)
    const viewW = canvas.width / (baseDpr * worldScale);
    const viewH = canvas.height / (baseDpr * worldScale);
    viewport.current = { w: viewW, h: viewH };

    // Xóa màn hình theo kích thước viewport
    ctx.fillStyle = "#2d3436"; 
    ctx.fillRect(0, 0, viewW, viewH);
    
    const myTank = socket?.id ? tankStateRef.current.tankStates[socket.id] : null;
    
    // --- LOGIC CAMERA CLAMP + CENTER FOR SMALL MAPS + SMOOTHING ---
    // Compute map real size in pixels
    const mapRows = dynamicMap.current.length || MAP_ROWS;
    const mapCols = dynamicMap.current[0]?.length || MAP_COLS;
    const MAP_REAL_W = mapCols * TILE_SIZE;
    const MAP_REAL_H = mapRows * TILE_SIZE;

    // Target camera (center on player if available)
    let targetCamX = 0, targetCamY = 0;
    if (myTank) {
      targetCamX = myTank.x - viewW / 2;
      targetCamY = myTank.y - viewH / 2;
    }

    // If the map is smaller than the viewport, center the whole map
    if (MAP_REAL_W <= viewW) {
      targetCamX = (MAP_REAL_W - viewW) / 2; // negative value -> centers map
    } else {
      targetCamX = Math.max(0, Math.min(targetCamX, MAP_REAL_W - viewW));
    }

    if (MAP_REAL_H <= viewH) {
      targetCamY = (MAP_REAL_H - viewH) / 2;
    } else {
      targetCamY = Math.max(0, Math.min(targetCamY, MAP_REAL_H - viewH));
    }

    // Smooth the camera to reduce visible jitter (lerp)
    const LERP = 0.15; // smaller -> smoother/slower
    const smoothCamX = lastCamPos.current.x + (targetCamX - lastCamPos.current.x) * LERP;
    const smoothCamY = lastCamPos.current.y + (targetCamY - lastCamPos.current.y) * LERP;
    lastCamPos.current.x = smoothCamX;
    lastCamPos.current.y = smoothCamY;

    const camX = smoothCamX;
    const camY = smoothCamY;

    if (needsStaticRedrawRef.current) rebuildStaticLayer();

    const staticCanvas = staticCanvasRef.current;
    if (staticCanvas) {
      // If the map is smaller than the viewport, draw the full map centered
      if (MAP_REAL_W <= viewW || MAP_REAL_H <= viewH) {
        const destX = Math.max(0, (viewW - MAP_REAL_W) / 2);
        const destY = Math.max(0, (viewH - MAP_REAL_H) / 2);
        // Clear background then draw static layer centered
        ctx.fillStyle = "#2d3436";
        ctx.fillRect(0, 0, viewW, viewH);
        ctx.drawImage(staticCanvas, 0, 0, MAP_REAL_W, MAP_REAL_H, destX, destY, MAP_REAL_W, MAP_REAL_H);
      } else {
        ctx.drawImage(staticCanvas, camX, camY, viewW, viewH, 0, 0, viewW, viewH);
      }
    }

    // --- VẼ THẾ GIỚI TRONG KHU VỰC VIEWPORT 100% ---
    ctx.save();
    ctx.translate(-camX, -camY); // Dịch chuyển thế giới

    drawMapCB(camX, camY, viewport, dynamicMap, groundImageRef, treeImageRef, towerRef, bushImageRef, mapIcons, ctx, { drawStatic: false, drawPickups: true });
    tankUpdatePosistion(keysPressed, tankGunAnimationState, socket, touchInput, tankStateRef); // Cập nhật vị trí tank dựa trên phím/touch và gửi lên server
    tankMovingAnimationCB(ctx, tankStateRef, tankAnimationState, keysPressed, tankBodyImageRef);
    tankGunAnimationCB(ctx, tankStateRef, tankGunAnimationState, keysPressed, tankGunImageRef);
    tankBulletAnimationCB(ctx, bulletStateRef, bulletAnimationState, bulletImageRef);
    tankHealthAnimationCB(ctx, tankStateRef, itemRef);
    gameSound()

    ctx.restore();

    // UI Debug (Vẽ đè lên trên cùng)
    if (DEBUG_MODE) {
        ctx.fillStyle = "yellow";
        ctx.font = "14px Arial";
        ctx.fillText(`DEBUG MODE ON`, 20, 30);
        ctx.fillText(`Tank: ${Math.round(myTank?.x || 0)}, ${Math.round(myTank?.y || 0)}`, 20, 50);
        ctx.fillText(`Cam: ${Math.round(camX)}, ${Math.round(camY)}`, 20, 70);
        ctx.fillText(`Screen: ${viewport.current.w} x ${viewport.current.h}`, 20, 90);
        // Vẽ score
        ctx.fillText(`Score: ${myTank?.score || 0}`, 20, 110);
    }
    
    animationFrameId.current = requestAnimationFrame(animate);
  }, [isImageLoaded, isGunImageLoaded, isBulletImageLoaded, isTreeImageLoaded, isBushImageLoaded, isMapLoaded, isMapIconsLoaded, isItemImageLoaded, drawMapCB, socket, viewport, tankMovingAnimationCB, tankGunAnimationCB, tankBulletAnimationCB, tankUpdatePosistionCB, rebuildStaticLayer]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animate);
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [animate]);

  if (!isAllAssetsLoaded || !isMapLoaded) {
      return (
          <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
              <div className="text-2xl font-bold mb-4">🚀 Đang tải tài nguyên...</div>
              <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-pulse w-full"></div>
              </div>
          </div>
      );
  }

  // Canvas full màn hình, không viền thừa
  return (
  <div className="w-full h-screen bg-gray-900 overflow-hidden relative">
    <Scoreboard 
    players={leaderboardData} 
        myId={socket?.id}
    />

    {isGameOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
            <h1 className="text-8xl font-black text-red-600 tracking-widest drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] animate-pulse">
                YOU DIED
            </h1>
            <p className="text-white mt-4 text-xl font-mono">Đang về sảnh...</p>
        </div>
    )}
    
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block"
    />
    <MobileDPad touchInput={touchInput} />
  </div>
  );
}

export default Game;