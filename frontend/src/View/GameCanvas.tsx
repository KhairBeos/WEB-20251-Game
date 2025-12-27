"use client";

import { useRef, useEffect } from "react";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewport = useRef({ w: 0, h: 0 });
  const dprRef = useRef<number>(1);



  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
   addEventListener("resize", () => {
     if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      console.log(dpr);
      dprRef.current = dpr;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      viewport.current = { w: width, h: height };
    });
  }, []);
      


  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="border-4 border-purple-500 w-100% h-100% block"
    />
  );
}
