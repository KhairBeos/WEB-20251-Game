import { useEffect, useRef, useState } from "react";

const FRAMES = [
  "/map/bui1.png",
  "/map/bui2.png",
  "/map/bui3.png",
  "/map/bui4.png",
];

const TOTAL_FRAMES = FRAMES.length;

function useLoadBush() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    FRAMES.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedImages[index] = img;
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          imageRef.current = loadedImages;
          setIsImageLoaded(true);
        }
      };
      img.onerror = () => {
        console.error(`Không thể tải frame ảnh: ${url}`);
      };
    });
  }, []);

  return { isImageLoaded, imageRef };
}

export default useLoadBush;
