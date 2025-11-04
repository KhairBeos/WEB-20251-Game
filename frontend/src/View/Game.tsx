"use client";
import { useRef, useEffect, useCallback, useState, RefObject } from "react";
import { GameState, Tank, TankAnimationState, TankState } from "../Model/Tank";
import { KeyMap } from "../Model/KeyMap";
import { assert } from "console";
import useLoadTankBody from "../Hook/useLoadTankBody";
import { useGameInput } from "../Hook/useGameInput";
import { tankMovingAnimation } from "../Animation/tankMovingAnimation";
import { tankUpdatePosistion } from "../Position/tankUpdatePosition";
import useLoadTankGun from "../Hook/useLoadTankGun";
import { tankGunAnimation } from "../Animation/tankGunAnimation";
import { TankGun } from "../Model/TankGun";
import useLoadLazeBullet from "../Hook/useLoadLazeBullet";
import useLoadTankBullet from "../Hook/useLoadTankBullet";
import { bulletUpdatePosistion } from "../Position/bulletUpdatePosistion";
import { spawnBullet } from "../Spawn/spawnBullet";
import { tankBulletAnimation } from "../Animation/tankBulletAnimation";
import { Bullet } from "../Model/Bullet";
import { LazeBullet } from "../Model/LazeBullet";
import { useSocket } from "../Hook/useSocket";
import { Socket } from "socket.io-client";


// Kích thước cố định của Canvas
const CANVAS_WIDTH = screen.width;
const CANVAS_HEIGHT = screen.height;
const FRAME_WIDTH = 40; // Chiều rộng của mỗi khung hình
const FRAME_HEIGHT = 80; // Chiều cao của mỗi khung hình
const ANIMATION_SPEED = 10; // Chuyển khung hình sau mỗi X frame game (Tốc độ chuyển động: 60fps / 6 = 10 khung hình/giây)

// Tốc độ di chuyển của vật thể (pixel/frame)
const PLAYER_SPEED = 5;

function Game() {
  const gameStateRef = useRef<GameState>({});
  const { socket, isConnected } = useSocket();

  useEffect(() => {
      // Đảm bảo socket tồn tại và được kết nối trước khi lắng nghe
      if (socket && isConnected) {
        // 1. Lắng nghe sự kiện từ Server
        socket.on('gameState', (state) => {
          // Cập nhật trạng thái game nhận được từ server
          //console.log('Received Game State:', state);
          gameStateRef.current = state;
          //console.log('Received Game State:', gameStateRef.current);
        });
  
        // CLEANUP: Tắt lắng nghe khi component bị hủy
        return () => {
          socket.off('gameState');
        };
      }
    }, [socket, isConnected]);

  
  // Ref để tham chiếu đến thẻ canvas trong DOM
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ref để lưu ID của requestAnimationFrame, giúp dừng hoạt ảnh khi component bị hủy
  const animationFrameId = useRef<number>(null);

  // Ref để lưu trữ đối tượng Image đã tải
  const {imageRef:tankBodyImageRef,isImageLoaded} = useLoadTankBody()
  const {imageRef:tankGunImageRef,isImageLoaded:isGunImageLoaded} =  useLoadTankGun()
  const {imageRef:lazeImageRef,isImageLoaded:isLazeImageLoaded} =  useLoadLazeBullet()
  const {imageRef:bulletImageRef,isImageLoaded:isBulletImageLoaded} =  useLoadTankBullet()

  const bulletsRef = useRef<Bullet[]>([]);
  // Ref để theo dõi trạng thái các phím W A S D đang được nhấn
  const keysPressed = useGameInput()

  // Ref để lưu trữ trạng thái hoạt ảnh của tank
  const tankAnimationState = useRef<TankAnimationState>({})
  
  // Cấu hình vật thể (quả bóng)
  const tank = useRef<Tank>({
    x: CANVAS_WIDTH / 2, // Vị trí ban đầu X (giữa)
    y: CANVAS_HEIGHT / 2, // Vị trí ban đầu Y (giữa)
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    frameIndex: 0, // Khung hình hoạt ảnh hiện tại
    frameCounter: 0, // Bộ đếm để điều chỉnh tốc độ hoạt ảnh
    // Thêm thuộc tính góc quay (degree)
    degree: Math.floor(Math.random() * 360), // Khởi tạo ngẫu nhiên từ 0 đến 359 độ
  });


  // Cấu hình vật thể (quả bóng)
  const tankGun = useRef<TankGun>({
    x: CANVAS_WIDTH / 2, // Vị trí ban đầu X (giữa)
    y: CANVAS_HEIGHT / 2, // Vị trí ban đầu Y (giữa)
    
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    frameIndex: 0, // Khung hình hoạt ảnh hiện tại
    frameCounter: 0, // Bộ đếm để điều chỉnh tốc độ hoạt ảnh

    // Thêm thuộc tính góc quay (degree)
    degree: tank.current.degree, // Khởi tạo ngẫu nhiên từ 0 đến 359 độ
    isShooting: false,
    lastShoot: 0,
  });

  const lazeBullet = useRef<LazeBullet>(
    {
      x: CANVAS_WIDTH / 2, // Vị trí ban đầu X (giữa)
      y: CANVAS_HEIGHT / 2, // Vị trí ban đầu Y (giữa)
      
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      frameIndex: 0, // Khung hình hoạt ảnh hiện tại
      frameCounter: 0, // Bộ đếm để điều chỉnh tốc độ hoạt ảnh

      // Thêm thuộc tính góc quay (degree)
      degree: tank.current.degree, // Khởi tạo ngẫu nhiên từ 0 đến 359 độ
    }
  )

  
  const tankGunAnitionCV = useCallback((
    ctx: CanvasRenderingContext2D,
    tankGun: RefObject<TankGun>,
    keysPressed: RefObject<KeyMap>,
    frames: RefObject<HTMLImageElement[]>,

  ) => tankGunAnimation(ctx,tankGun,keysPressed,frames),[isGunImageLoaded])

  const tankMovingAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    gameState: RefObject<GameState>,
    tankAnimationState: RefObject<TankAnimationState>,
    frames: RefObject<HTMLImageElement[]>
  ) => tankMovingAnimation(ctx,gameState,tankAnimationState,frames),[isImageLoaded])

  const tankBulletAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    bullets: RefObject<Bullet[]>,
    frames: RefObject<HTMLImageElement[]>
  ) => tankBulletAnimation(ctx,bullets,frames),[isBulletImageLoaded])

  const tankUpdatePosistionCB = useCallback((
    tank: RefObject<Tank>,
     tankGun: RefObject<TankGun>,
    keysPressed: RefObject<KeyMap>,
    socket: Socket|null
  ) => tankUpdatePosistion(tank,tankGun,keysPressed,socket),[])

  

  const bulletUpdatePosistionCB = useCallback((
    bullets : RefObject<Bullet[]>,
    keysPressed: RefObject<KeyMap>,
  ) => bulletUpdatePosistion(bullets,keysPressed),[])

  const spawnBulletCB = useCallback((
    bullets : RefObject<Bullet[]>,
  tankGun: RefObject<TankGun>,
    keysPressed: RefObject<KeyMap>
  ) => spawnBullet(bullets,tankGun,keysPressed),[])

  // Vòng lặp hoạt ảnh chính
  const animate = useCallback(() => {
    //console.log("animation")
    const canvas = canvasRef.current;

    if (!canvas || !isImageLoaded) {
      // Cải tiến: Nếu chưa tải xong, tiếp tục request frame cho đến khi tải xong.
      animationFrameId.current = requestAnimationFrame(animate);
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      // Cải tiến: Nếu chưa tải xong, tiếp tục request frame cho đến khi tải xong.
      animationFrameId.current = requestAnimationFrame(animate);
      return;
    }

    // 1. Xóa toàn bộ Canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Cap nhat tank theo 

    //spawnBullet(bulletsRef,tankGun,keysPressed)

    tankUpdatePosistionCB(tank,tankGun,keysPressed,socket)
    //bulletUpdatePosistionCB(bulletsRef,keysPressed)

    tankMovingAnimationCB(ctx,gameStateRef,tankAnimationState,tankBodyImageRef)
    //tankGunAnitionCV(ctx,tankGun,keysPressed,tankGunImageRef)
    //tankBulletAnimationCB(ctx,bulletsRef,bulletImageRef)

    // 4. Yêu cầu frame tiếp theo
    animationFrameId.current = requestAnimationFrame(animate);
  }, [isImageLoaded,isGunImageLoaded]);


  // useEffect để khởi tạo, chạy hoạt ảnh và gắn event listeners
  useEffect(() => {
    // 1. Khởi tạo và chạy hoạt ảnh
    if (isImageLoaded) {
      animationFrameId.current = requestAnimationFrame(animate);
    }

    // Hàm dọn dẹp (cleanup)
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [animate, isImageLoaded]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border-4 border-purple-500 rounded-lg bg-gray-50"
    />
  );
}

export default Game;
