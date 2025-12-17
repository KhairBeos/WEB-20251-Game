import { useEffect, useRef, useState } from "react";

// Tank feature assets under /public/tank_features
// We load both the health bar frame (array) and a map of small buff icons
const FRAMES = [
  "/tank_features/health_bar_empty.png",
];

const ICON_SOURCES: Record<string, string> = {
  health_buff: "/tank_features/health_buff.svg",
  shield: "/tank_features/shield_indicator.svg",
  speed: "/tank_features/speed_boost.svg",
  damage: "/tank_features/damage_buff.svg",
};

const TOTAL_FRAMES = FRAMES.length;

function useLoadTankFeatures() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement[]>([]);
  const images = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    // load frame(s)
    FRAMES.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedImages[index] = img;
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          imageRef.current = loadedImages;
          // don't set loaded state here; wait for icons too
        }
      };
      img.onerror = () => {
        console.error(`Không thể tải frame ảnh: ${url}`);
      };
    });

    // load icons
    const iconKeys = Object.keys(ICON_SOURCES);
    let iconsLoaded = 0;
    iconKeys.forEach((k) => {
      const img = new Image();
      img.src = ICON_SOURCES[k];
      img.onload = () => {
        images.current[k] = img;
        iconsLoaded++;
        // when both frames and icons are ready, mark loaded
        if (iconsLoaded === iconKeys.length && loadedCount === TOTAL_FRAMES) {
          setIsImageLoaded(true);
        }
      };
      img.onerror = () => {
        console.error(`Không thể tải icon: ${ICON_SOURCES[k]}`);
        // still count to avoid blocking
        iconsLoaded++;
        if (iconsLoaded === iconKeys.length && loadedCount === TOTAL_FRAMES) {
          setIsImageLoaded(true);
        }
      };
    });
  }, []);

  return { isImageLoaded, imageRef, images: images.current };
}

export default useLoadTankFeatures;
