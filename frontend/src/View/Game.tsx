"use client";
import { RefObject, useCallback, useEffect, useRef } from "react";
import { tankBulletAnimation } from "../Animation/tankBulletAnimation";
import { tankGunAnimation } from "../Animation/tankGunAnimation";
import { tankMovingAnimation } from "../Animation/tankMovingAnimation";
import { useGameInput } from "../Hook/useGameInput";
import useLoadLazeBullet from "../Hook/useLoadLazeBullet";
import useLoadTankBody from "../Hook/useLoadTankBody";
import useLoadTankBullet from "../Hook/useLoadTankBullet";
import useLoadTankGun from "../Hook/useLoadTankGun";
import { Bullet, BulletAnimationState, BulletState } from "../Model/Bullet";
import { KeyMap } from "../Model/KeyMap";
import { TankAnimationState, TankState } from "../Model/Tank";
import { TankGun, TankGunAnimationState } from "../Model/TankGun";
import { tankUpdatePosistion } from "../Position/tankUpdatePosition";


import { Socket } from "socket.io-client";
import { useSocket } from "../Hook/useSocket";
import { tankHealthAnimation } from "../Animation/tankHealthAnimation";


// Kích thước cố định của Canvas
const CANVAS_WIDTH = screen.width;
const CANVAS_HEIGHT = screen.height;
const FRAME_WIDTH = 40; // Chiều rộng của mỗi khung hình
const FRAME_HEIGHT = 80; // Chiều cao của mỗi khung hình
const ANIMATION_SPEED = 10; // Chuyển khung hình sau mỗi X frame game (Tốc độ chuyển động: 60fps / 6 = 10 khung hình/giây)

// Tốc độ di chuyển của vật thể (pixel/frame)
const PLAYER_SPEED = 5;

function Game() {

  // Ref để lưu trữ trạng thái tanks nhận được từ server
  const tankStateRef = useRef<TankState>({
    serverTimestamp: 0,
    tankStates: {}
  });

  // Ref để lưu trữ trạng thái bullets nhận được từ server
  const bulletStateRef = useRef<BulletState>({
    serverTimestamp: 0,
    bulletStates: {}
  });

  const { socket, isConnected } = useSocket();

  useEffect(() => {
      // Đảm bảo socket tồn tại và được kết nối trước khi lắng nghe
      if (socket && isConnected) {
        // 1. Lắng nghe sự kiện tankState từ Server
        socket.on('tankState', (state) => {
          // Cập nhật trạng thái game nhận được từ server
          //console.log('Received Game State:', state);
          tankStateRef.current = state;
          //console.log('Received Game State:', gameStateRef.current);
        });

         // 1. Lắng nghe sự kiện bulletState từ Server
        socket.on('bulletState', (state) => {
          // Cập nhật trạng thái game nhận được từ server
          //console.log('Received Game State:', state);
          bulletStateRef.current = state;
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

  // Ref để lưu trữ trạng thái hoạt ảnh di chuyen của tank
  const tankAnimationState = useRef<TankAnimationState>({})
  // Ref để lưu trữ trạng thái hoạt ảnh bắn của tank
  const tankGunAnimationState = useRef<TankGunAnimationState>({})
  // Ref để lưu trữ trạng thái hoạt ảnh đạn
  const bulletAnimationState = useRef<BulletAnimationState>({})

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
    socket: Socket|null
  ) => tankUpdatePosistion(keysPressed,tankGunAnimationState,socket),[])

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

    tankUpdatePosistionCB(keysPressed,tankGunAnimationState,socket)
    //bulletUpdatePosistionCB(bulletsRef,keysPressed)

    tankMovingAnimationCB(ctx,tankStateRef,tankAnimationState,keysPressed,tankBodyImageRef)
    tankGunAnimationCB(ctx,tankStateRef,tankGunAnimationState,keysPressed,tankGunImageRef)
    tankBulletAnimationCB(ctx,bulletStateRef,bulletAnimationState,bulletImageRef)
    tankHealthAnimation(ctx,tankStateRef,keysPressed)

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
