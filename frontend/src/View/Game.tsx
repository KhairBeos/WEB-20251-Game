"use client";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import drawMap from "../Animation/drawMap";
import { tankBulletAnimation } from "../Animation/tankBulletAnimation";
import { tankGunAnimation } from "../Animation/tankGunAnimation";
import { tankHealthAnimation } from "../Animation/tankHealthAnimation";
import { tankMovingAnimation } from "../Animation/tankMovingAnimation";
import { TILE_SIZE } from "../GlobalSetting";
import { useGameInput } from "../Hook/useGameInput";
import useLoadGround from "../Hook/useLoadGround";
import useLoadTankBody from "../Hook/useLoadTankBody";
import useLoadTankBullet from "../Hook/useLoadTankBullet";
import useLoadTankGun from "../Hook/useLoadTankGun";
import useLoadTower from "../Hook/useLoadTower";
import useLoadTree from "../Hook/useLoadTree";
import { useSocket } from "../Hook/useSocket";
import { BulletAnimationState, BulletState } from "../Model/Bullet";
import { KeyMap } from "../Model/KeyMap";
import { MAP_COLS, MAP_ROWS, MapCell } from "../Model/MapData";
import { TankAnimationState, TankState } from "../Model/Tank";
import { TankGunAnimationState } from "../Model/TankGun";
import { tankUpdatePosistion } from "../Position/tankUpdatePosition";

const SKIN_IDS = ["scarlet", "desert", "ocean", "lemon", "violet"];
const DEBUG_MODE = true;

type GameProps = {
  selectedSkin?: string;
  username?: string;
};

function Game({ selectedSkin = "scarlet" }: GameProps) {
  const tankStateRef = useRef<TankState>({ serverTimestamp: 0, tankStates: {} });
  const bulletStateRef = useRef<BulletState>({ serverTimestamp: 0, bulletStates: {} });
  const dynamicMap = useRef<MapCell[][]>([]);
  const viewport = useRef({ w: 1200, h: 800 });

  const { socket, isConnected } = useSocket({ skin: selectedSkin });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const selectedSkinImgRef = useRef<HTMLImageElement | null>(null);
  const skinImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [isSkinLoaded, setIsSkinLoaded] = useState(false);
  const [isAllSkinsLoaded, setIsAllSkinsLoaded] = useState(false);

  const { imageRef: tankBodyImageRef, isImageLoaded } = useLoadTankBody();
  const { imageRef: tankGunImageRef, skinGunFramesRef, isImageLoaded: isTankGunImageLoaded } = useLoadTankGun();
  const { imageRef: bulletImageRef, isImageLoaded: isBulletImageLoaded } = useLoadTankBullet();
  const { imageRef: treeImageRef, isImageLoaded: isTreeImageLoaded } = useLoadTree();
  const { imageRef: groundImageRef, isImageLoaded: isGroundImageLoaded } = useLoadGround();
  const { imageRef: towerRef, isImageLoaded: isTowerImageLoaded } = useLoadTower();

  const keysPressed = useGameInput();

  const tankAnimationState = useRef<TankAnimationState>({});
  const bulletAnimationState = useRef<BulletAnimationState>({});
  const tankGunAnimationState = useRef<TankGunAnimationState>({});

  useEffect(() => {
    if (socket && isConnected) {
      socket.on("tankState", (s) => (tankStateRef.current = s));
      socket.on("bulletState", (s) => (bulletStateRef.current = s));

      socket.on("mapData", ({ map }) => (dynamicMap.current = map));
      socket.on("mapUpdate", ({ r, c, cell }) => {
        if (dynamicMap.current[r]) dynamicMap.current[r][c] = cell;
      });

      return () => {
        socket.off("tankState");
        socket.off("bulletState");
        socket.off("mapData");
        socket.off("mapUpdate");
      };
    }
  }, [socket, isConnected]);

  const tankMovingAnimationCB = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      tankState: RefObject<TankState>,
      tankAnimState: RefObject<TankAnimationState>,
      input: RefObject<KeyMap>,
      frames: RefObject<HTMLImageElement[]>,
      customSkin?: {
        playerId?: string | null;
        image?: HTMLImageElement | null;
        skinImages?: Record<string, HTMLImageElement | undefined>;
      }
    ) => tankMovingAnimation(ctx, tankState, tankAnimState, input, frames, customSkin),
    [isImageLoaded]
  );

  const tankBulletAnimationCB = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      bulletState: RefObject<BulletState>,
      bulletAnimState: RefObject<BulletAnimationState>,
      frames: RefObject<HTMLImageElement[]>
    ) => tankBulletAnimation(ctx, bulletState, bulletAnimState, frames),
    [isBulletImageLoaded]
  );

  const tankUpdatePosistionCB = useCallback(
    (input: RefObject<KeyMap>, sock: any) => tankUpdatePosistion(input, tankGunAnimationState, sock),
    []
  );

  const tankGunAnimationCB = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      tankState: RefObject<TankState>,
      tankGunAnimState: RefObject<TankGunAnimationState>,
      input: RefObject<KeyMap>,
      frames: RefObject<HTMLImageElement[]>,
      skinGunFrames: RefObject<Record<string, HTMLImageElement[]>>
    ) => tankGunAnimation(ctx, tankState, tankGunAnimState, input, frames, skinGunFrames),
    [isTankGunImageLoaded]
  );

  const drawMapCB = useCallback(
    (
      camX: number,
      camY: number,
      viewPort: RefObject<{ w: number; h: number }>,
      mapRef: RefObject<MapCell[][]>,
      groundImg: RefObject<HTMLImageElement[]>,
      treeImg: RefObject<HTMLImageElement[]>,
      towerImg: RefObject<HTMLImageElement[]>,
      ctx: CanvasRenderingContext2D
    ) => {
      drawMap(camX, camY, mapRef, viewPort, groundImg, treeImg, towerImg, ctx);
    },
    [isGroundImageLoaded, isTreeImageLoaded, isTowerImageLoaded]
  );

  useEffect(() => {
    setIsSkinLoaded(false);
    const primary = `/skins/${selectedSkin}.png`;
    const fallback = `/skin/${selectedSkin}.png`;
    const img = new Image();
    img.onload = () => {
      selectedSkinImgRef.current = img;
      setIsSkinLoaded(true);
    };
    img.onerror = () => {
      const alt = new Image();
      alt.onload = () => {
        selectedSkinImgRef.current = alt;
        setIsSkinLoaded(true);
      };
      alt.onerror = () => {
        selectedSkinImgRef.current = null;
        setIsSkinLoaded(false);
      };
      alt.src = fallback;
    };
    img.src = primary;
  }, [selectedSkin]);

  useEffect(() => {
    const loaded: Record<string, HTMLImageElement> = {};
    let loadedCount = 0;
    SKIN_IDS.forEach((id) => {
      const img = new Image();
      img.src = `/skins/${id}.png`;
      img.onload = () => {
        loaded[id] = img;
        loadedCount++;
        if (loadedCount === SKIN_IDS.length) {
          skinImagesRef.current = loaded;
          setIsAllSkinsLoaded(true);
        }
      };
      img.onerror = () => {
        const alt = new Image();
        alt.onload = () => {
          loaded[id] = alt;
          loadedCount++;
          if (loadedCount === SKIN_IDS.length) {
            skinImagesRef.current = loaded;
            setIsAllSkinsLoaded(true);
          }
        };
        alt.onerror = () => {
          loadedCount++;
          if (loadedCount === SKIN_IDS.length) {
            skinImagesRef.current = loaded;
            setIsAllSkinsLoaded(true);
          }
        };
        alt.src = `/skin/${id}.png`;
      };
    });
  }, []);

  const [isMapLoaded] = useState(true);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isImageLoaded || !isMapLoaded) {
      animationFrameId.current = requestAnimationFrame(animate);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#2d3436";
    ctx.fillRect(0, 0, viewport.current.w, viewport.current.h);

    const myTank = socket?.id ? tankStateRef.current.tankStates[socket.id] : null;

    let camX = 0;
    let camY = 0;
    const mapRealW = MAP_COLS * TILE_SIZE;
    const mapRealH = MAP_ROWS * TILE_SIZE;

    if (myTank) {
      camX = myTank.x - viewport.current.w / 2;
      camY = myTank.y - viewport.current.h / 2;

      camX = Math.max(0, camX);
      camY = Math.max(0, camY);

      if (mapRealW > viewport.current.w) {
        camX = Math.min(camX, mapRealW - viewport.current.w);
      }
      if (mapRealH > viewport.current.h) {
        camY = Math.min(camY, mapRealH - viewport.current.h);
      }
    }

    ctx.save();
    ctx.translate(-camX, -camY);

    drawMapCB(camX, camY, viewport, dynamicMap, groundImageRef, treeImageRef, towerRef, ctx);
    tankUpdatePosistionCB(keysPressed, socket);
    tankMovingAnimationCB(ctx, tankStateRef, tankAnimationState, keysPressed, tankBodyImageRef, {
      playerId: socket?.id || null,
      image: isSkinLoaded ? selectedSkinImgRef.current : null,
      skinImages: isAllSkinsLoaded ? skinImagesRef.current : {},
    });
    tankGunAnimationCB(ctx, tankStateRef, tankGunAnimationState, keysPressed, tankGunImageRef, skinGunFramesRef);
    tankBulletAnimationCB(ctx, bulletStateRef, bulletAnimationState, bulletImageRef);
    tankHealthAnimation(ctx, tankStateRef, keysPressed);

    ctx.restore();

    if (DEBUG_MODE) {
      ctx.fillStyle = "yellow";
      ctx.font = "14px Arial";
      ctx.fillText(`DEBUG MODE ON`, 20, 30);
      ctx.fillText(`Tank: ${Math.round(myTank?.x || 0)}, ${Math.round(myTank?.y || 0)}`, 20, 50);
      ctx.fillText(`Cam: ${Math.round(camX)}, ${Math.round(camY)}`, 20, 70);
      ctx.fillText(`Screen: ${viewport.current.w} x ${viewport.current.h}`, 20, 90);
    }

    animationFrameId.current = requestAnimationFrame(animate);
  }, [isImageLoaded, isMapLoaded, isSkinLoaded, isTankGunImageLoaded, drawMapCB, socket, tankMovingAnimationCB, tankGunAnimationCB, tankBulletAnimationCB, tankUpdatePosistionCB]);

  useEffect(() => {
    if (isImageLoaded) {
      animationFrameId.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [animate, isImageLoaded]);

  return (
    <canvas
      ref={canvasRef}
      width={viewport.current.w}
      height={viewport.current.h}
      className="bg-gray-900 block touch-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

export default Game;
