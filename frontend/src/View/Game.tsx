"use client";
import { useRef, useEffect, useCallback, useState, RefObject } from "react";
import { Tank } from "../Model/Tank";
import { KeyMap } from "../Model/KeyMap";
import { assert } from "console";
import useLoadTankBody from "../Hook/useLoadTankBody";
import { useGameInput } from "../Hook/useGameInput";
import { tankMovingAnimation } from "../Animation/tankMovingAnimation";
import { tankUpdatePosistion } from "../Position/tankUpdatePosition";
import useLoadTankGun from "../Hook/useLoadTankGun";
import { tankGunAnimation } from "../Animation/tankGunAnimation";

// Kích thước cố định của Canvas
const CANVAS_WIDTH = screen.width;
const CANVAS_HEIGHT = screen.height;
const FRAME_WIDTH = 40; // Chiều rộng của mỗi khung hình
const FRAME_HEIGHT = 80; // Chiều cao của mỗi khung hình
const ANIMATION_SPEED = 10; // Chuyển khung hình sau mỗi X frame game (Tốc độ chuyển động: 60fps / 6 = 10 khung hình/giây)

// Tốc độ di chuyển của vật thể (pixel/frame)
const PLAYER_SPEED = 5;

function Game() {
  // Ref để tham chiếu đến thẻ canvas trong DOM
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ref để lưu ID của requestAnimationFrame, giúp dừng hoạt ảnh khi component bị hủy
  const animationFrameId = useRef<number>(null);

  // Ref để lưu trữ đối tượng Image đã tải
  const {imageRef:tankBodyImageRef,isImageLoaded} = useLoadTankBody()
  const {imageRef:tankGunImageRef,isImageLoaded:isGunImageLoaded} =  useLoadTankGun()
  

  // Ref để theo dõi trạng thái các phím W A S D đang được nhấn
  const keysPressed = useGameInput()
  
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

  
  const tankGunAnitionCV = useCallback((
    ctx: CanvasRenderingContext2D,
    tank: RefObject<Tank>,
    keysPressed: RefObject<KeyMap>,
    frames: RefObject<HTMLImageElement[]>
  ) => tankGunAnimation(ctx,tank,keysPressed,frames),[isGunImageLoaded])

  const tankMovingAnimationCB = useCallback((
    ctx: CanvasRenderingContext2D,
    tank: RefObject<Tank>,
    keysPressed: RefObject<KeyMap>,
    frames: RefObject<HTMLImageElement[]>
  ) => tankMovingAnimation(ctx,tank,keysPressed,frames),[isImageLoaded])

  const tankUpdatePosistionCB = useCallback((
    tank: RefObject<Tank>,
    keysPressed: RefObject<KeyMap>,
  ) => tankUpdatePosistion(tank,keysPressed),[])

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

    tankUpdatePosistionCB(tank,keysPressed)

    tankMovingAnimationCB(ctx,tank,keysPressed,tankBodyImageRef)

    tankGunAnitionCV(ctx,tank,keysPressed,tankGunImageRef)

    // 4. Yêu cầu frame tiếp theo
    animationFrameId.current = requestAnimationFrame(animate);
  }, [isImageLoaded]);


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
