"use client";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import drawMap from "../Animation/drawMap";
import { useRouter } from "next/navigation";
import { tankBulletAnimation } from "../Animation/tankBulletAnimation";
import { tankGunAnimation } from "../Animation/tankGunAnimation";
import { tankHealthAnimation } from "../Animation/tankHealthAnimation";
import { tankMovingAnimation } from "../Animation/tankMovingAnimation";
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEBUG_MODE, MAX_CANVAS_HEIGHT, MAX_CANVAS_WIDTH, MAX_DPR, TILE_SIZE, VISIBLE_COLS, VISIBLE_ROWS } from "../GlobalSetting"; // Chỉ lấy TILE_SIZE, kích thước màn hình sẽ tự tính
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
import useLoadMapIcons from "../Hook/useLoadMapIcons";
import useLoadItem from "../Hook/useLoadTankFeatures";
import { SoundState } from "../Model/Sound";

interface GameProps {
  playerName: string;
  skin: string;
}

function Game({ playerName, skin }: GameProps) {
  // console.log("Game component rendered with playerName:", playerName);

  const router = useRouter();

  // --- STATE GAME ---
  const [isGameOver, setIsGameOver] = useState(false);
  const tankStateRef = useRef<TankState>({ serverTimestamp: 0, tankStates: {} });
  const bulletStateRef = useRef<BulletState>({ serverTimestamp: 0, bulletStates: {} });
  const dynamicMap= useRef<MapCell[][]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [ping, setPing] = useState<number>(0);
  
  // --- STATE MÀN HÌNH (VIEWPORT) ---
  
  const { socket, isConnected } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(null);
  const dprRef = useRef<number>(Math.max(1, Math.min(window.devicePixelRatio || 1, MAX_DPR)));
  const cssViewportRef = useRef<{ w: number; h: number }>({ w: CANVAS_WIDTH, h: CANVAS_HEIGHT });
  const [isPortrait, setIsPortrait] = useState(false);
  const viewport = useRef({ w: CANVAS_WIDTH , h: CANVAS_HEIGHT  });
  // console.log("viewport", viewport);

  // //  LOAD ASSET ---
  const {imageRef:tankBodyImageRef,skinGunFramesRef: skinBodyFramesRef,isImageLoaded} = useLoadTankBody()
  const { imageRef: tankGunImageRef, skinGunFramesRef, isImageLoaded: isTankGunImageLoaded } = useLoadTankGun();
  
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

  // --- Tank position interpolation (smooth movement between server updates) ---
  const tankPosInterpolationRef = useRef<{ [playerId: string]: { lastX: number; lastY: number; lastUpdateTime: number } }>({});

  //  TAO ANIMATION STATE DE RENDER ANIMATION ---
  // Ref để lưu trữ trạng thái hoạt ảnh di chuyen của tank
  const tankAnimationState = useRef<TankAnimationState>({})
  // Ref để lưu trữ trạng thái hoạt ảnh bắn của tank
  const tankGunAnimationState = useRef<TankGunAnimationState>({})
  // Ref để lưu trữ trạng thái hoạt ảnh đạn
  const bulletAnimationState = useRef<BulletAnimationState>({})
  // useEffect để khởi tạo, chạy hoạt ảnh và gắn event listeners
  const isAllAssetsLoaded = isImageLoaded && isTankGunImageLoaded  && isBulletImageLoaded && isTreeImageLoaded && isBushImageLoaded && isGroundImageLoaded && isTowerImageLoaded && isItemImageLoaded && isMapIconsLoaded;

  //  XỬ LÝ RESIZE MÀN HÌNH ---
  useEffect(() => {
      const handleResize = () => {
          // Cập nhật kích thước viewport theo cửa sổ trình duyệt (prioritize visualViewport on mobile)
          const vv = (window as any).visualViewport;
          var wCss = vv && typeof vv.width === 'number' ? vv.width : window.innerWidth;
          var hCss = vv && typeof vv.height === 'number' ? vv.height : window.innerHeight;

          viewport.current = { w: wCss, h: hCss };
          // store CSS-pixel viewport separately so animate() can use the exact CSS size
          cssViewportRef.current = { w: wCss, h: hCss };
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
        window.addEventListener('orientationchange', handleResize);
        // portrait detection for mobile: block play when portrait to avoid unfair vision
        const checkPortrait = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          setIsPortrait(h > w && w < 900); // treat narrow widths as mobile portrait
        };
        checkPortrait();
        window.addEventListener('resize', checkPortrait);
        window.addEventListener('orientationchange', checkPortrait);
        return () => window.removeEventListener('resize', handleResize);
  }, [socket, isAllAssetsLoaded]);

  useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      if(socket == null) return;
      if(socket.id == null) return;
      console.log("Requesting to gain XP...");
      socket.emit("gain_xp", {
        playerId: socket.id,
        xp: 20,
      }); // CHỈ gửi intent
    }
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [socket]);

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

      if( skin ) {
          console.log("Gửi lệnh RegisterSkin:", skin);
          socket.emit('registerSkin', { skin: skin });
      }

      return () => { 
          socket.off('tankState'); socket.off('bulletState'); 
          socket.off('mapData'); socket.off('mapUpdate'); 
          socket.off('gameOver'); socket.off('sessionRestored');
      };
    }
  }, [socket, isConnected, playerName, router]);



  // Ping measurement
  function measurePing(socket:any) {
  const start = performance.now();
  socket.emit("ping", start);

  socket.once("pong", (serverTime:any) => {
    const end = performance.now();
    const ping = end - start;
    console.log("Ping:", Math.round(ping), "ms");
    setPing(Math.round(ping));
  });
}

  useEffect(() => { 
    if (socket) {
      const interval = setInterval(() => {
        measurePing(socket);
      }, 5000); // Ping every 5 seconds
      return () => clearInterval(interval);
    }
  }, [socket, isAllAssetsLoaded]);
    

  // Leadersboard update every second
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
    skinGunFrames?: RefObject<Record<string, HTMLImageElement[]>>,
  ) => tankMovingAnimation(ctx,tankState,tankAnimationState,keysPressed,frames, socket?.id, hitSoundRef,skinGunFrames ),[isImageLoaded, socket?.id,hitSoundRef])

  // Animation cho tank gun
  const tankGunAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    tankState: RefObject<TankState>,
    tankGunAnimationState: RefObject<TankGunAnimationState>,
    keysPressed: RefObject<KeyMap>,
    frames: RefObject<HTMLImageElement[]>,
    skinGunFrames: RefObject<Record<string, HTMLImageElement[]>>
  ) => tankGunAnimation(ctx,tankState,tankGunAnimationState,keysPressed,frames, socket?.id, fireSoundRef,skinGunFrames),[isTankGunImageLoaded, socket?.id, fireSoundRef])

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
    worldScale: number,
  ) => {
    drawMap(camX,camY,dynamicMap,viewPort,groundImg,treeImg,towerImg,bushImg,icons,ctx, worldScale);
  },[isGroundImageLoaded,isTreeImageLoaded,isTowerImageLoaded,isBushImageLoaded,isMapIconsLoaded, socket?.id])

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

  const lastSendRef = useRef(0);
  const SEND_INTERVAL = 10; // 20Hz

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
    // Desired visible area expressed as number of tiles (keeps world-units consistent)
  
    const DESIGN_VIEW_W = VISIBLE_COLS * TILE_SIZE; // target virtual viewport width (world units)
    const DESIGN_VIEW_H = VISIBLE_ROWS * TILE_SIZE;  // target virtual viewport height
    // console.log(`Design view size: ${DESIGN_VIEW_W}x${DESIGN_VIEW_H}`);
    // Base device pixel ratio transform
    const baseDpr = dprRef.current;
    // Raw CSS-pixel viewport (before world scaling). Prefer the CSS viewport saved on resize
    const rawViewW = cssViewportRef.current.w;
    const rawViewH = cssViewportRef.current.h;
    // console.log(`Viewport CSS size: ${rawViewW}x${rawViewH}, canvas size: ${canvas.width}x${canvas.height}, DPR: ${baseDpr}`);
    
    var worldScale = 1;
    // Nếu Màn hình nhỏ hơn kích thước thiết kế, scale thế giới xuống để vừa khít
    worldScale = Math.max(rawViewH / DESIGN_VIEW_H, rawViewW / DESIGN_VIEW_W);
    // Nếu Màn hình lớn hơn kích thước thiết kế, scale thế giới lên để không bị khoảng trống
    worldScale =  Math.max(rawViewH / DESIGN_VIEW_H, rawViewW / DESIGN_VIEW_W);
    // console.log(`World scale: ${worldScale}`);
    
    ctx.setTransform(baseDpr, 0, 0, baseDpr, 0, 0);
    
    const myTank = socket?.id ? tankStateRef.current.tankStates[socket.id] : null;
    if(!myTank) {
      animationFrameId.current = requestAnimationFrame(animate); 
      return;
    }
    
    const MAP_REAL_W = MAP_COLS * TILE_SIZE;
    const MAP_REAL_H = MAP_ROWS * TILE_SIZE;
    
    // Tính toán vị trí camera để giữ tank ở giữa màn hình
    let camX = myTank.x - viewport.current.w / 2 / worldScale;
    let camY = myTank.y - viewport.current.h / 2 / worldScale;
    // console.log('tank pos:', myTank.x, myTank.y);
    // console.log('cam pos before clamp:', camX, camY);

    // Giới hạn camera trong biên map
    camX = Math.max(0, Math.min(MAP_REAL_W - viewport.current.w / worldScale, camX));
    camY = Math.max(0, Math.min(MAP_REAL_H - viewport.current.h / worldScale, camY));
    // console.log('cam pos after clamp:', camX, camY);
    
    ctx.scale(worldScale, worldScale);
    ctx.save();
    ctx.translate(-camX , -camY ); // Dịch chuyển thế giới

    drawMapCB(camX, camY, viewport, dynamicMap, groundImageRef, treeImageRef, towerRef, bushImageRef, mapIcons, ctx, worldScale); // Vẽ map
    tankMovingAnimationCB(ctx, tankStateRef, tankAnimationState, keysPressed, tankBodyImageRef, skinBodyFramesRef);
    tankGunAnimationCB(ctx, tankStateRef, tankGunAnimationState, keysPressed, tankGunImageRef, skinGunFramesRef);
    tankBulletAnimationCB(ctx, bulletStateRef, bulletAnimationState, bulletImageRef);
    tankHealthAnimationCB(ctx, tankStateRef, itemRef);
    gameSound()
    
    const time = Date.now();
    if (time - lastSendRef.current >= SEND_INTERVAL) {
      tankUpdatePosistion(keysPressed, tankGunAnimationState, socket, touchInput, tankStateRef); // Cập nhật vị trí tank dựa trên phím/touch và gửi lên server
      lastSendRef.current = time;
  }
    
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
  }, [isImageLoaded, isTankGunImageLoaded, isBulletImageLoaded, isTreeImageLoaded, isBushImageLoaded, isMapLoaded, isMapIconsLoaded, isItemImageLoaded, drawMapCB, socket, viewport, tankMovingAnimationCB, tankGunAnimationCB, tankBulletAnimationCB, tankUpdatePosistionCB]);

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

    {/* Draw score board */}
    <Scoreboard 
    players={leaderboardData} 
        myId={socket?.id}
    />

    {/* Draw Ping in left score board */}
    <div className="absolute top-4 left-4 z-40 bg-black/50 text-white px-3 py-1 rounded-md text-sm font-mono">
        <span>Ping: </span>
        <span id="ping-value">{ping} ms</span>
    </div>

    {isGameOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
            <h1 className="text-8xl font-black text-red-600 tracking-widest drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] animate-pulse">
                YOU DIED
            </h1>
            <p className="text-white mt-4 text-xl font-mono">Đang về sảnh...</p>
        </div>
    )}
    
    {/* Portrait overlay: block play on tall/narrow screens */}
    {isPortrait && (
      <div className="absolute inset-0 z-60 flex flex-col items-center justify-center bg-black/90 text-white p-6">
        <div className="text-2xl font-bold mb-4">Vui lòng xoay điện thoại sang ngang</div>
        <div className="text-sm opacity-80 mb-6">Game yêu cầu chế độ ngang để công bằng về tầm nhìn.</div>
        <div className="w-28 h-28 rounded-full border-4 border-white/30 flex items-center justify-center">
          <div className="transform rotate-90 text-3xl">↺</div>
        </div>
      </div>
    )}

    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH * dprRef.current}
      height={CANVAS_HEIGHT * dprRef.current}
      className={`block w-[${CANVAS_WIDTH}px] h-[${CANVAS_HEIGHT}px] `}
    />
    <MobileDPad touchInput={touchInput} />
  </div>
  );
}

export default Game;