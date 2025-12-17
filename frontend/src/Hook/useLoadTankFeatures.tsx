import { useEffect, useRef, useState } from "react";

// Tank feature assets under /public/tank_features
// We load both the health bar frame (array) and a map of small buff icons

const ICON_SOURCES = [
 "/tank_features/health_buff.svg",
  "/tank_features/shield_indicator.svg",
  "/tank_features/speed_boost.svg",
  "/tank_features/damage_buff.svg"
];

function useLoadItem() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];
    ICON_SOURCES.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedImages[index] = img;
        loadedCount++;
        if (loadedCount === ICON_SOURCES.length) {
          imageRef.current = loadedImages;
          setIsImageLoaded(true);
        }
      };
      img.onerror = () => {
        console.error(`Failed to load tank feature image: ${url}`);
      }
    });
  }, []);

  return { isImageLoaded , imageRef };
}

export default useLoadItem;
