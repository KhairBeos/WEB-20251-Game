import { useEffect, useRef, useState } from "react";

// Map icon assets placed under /public/map_icon
const ICON_SOURCES: Record<string, string> = {
  health: "/map_icon/health.svg",
  shield: "/map_icon/shield.svg",
  speedBoost: "/map_icon/speed_boost.svg",
  damageBoost: "/map_icon/damage_boost.svg",
};

function useLoadMapIcons() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement[]>([]);
  const images = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const keys = Object.keys(ICON_SOURCES);
    let loadedCount = 0;
    const total = keys.length;
    const loadedImages: HTMLImageElement[] = [];
    const map: Record<string, HTMLImageElement> = {};

    keys.forEach((key, index) => {
      const src = ICON_SOURCES[key];
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedImages[index] = img;
        map[key] = img;
        loadedCount++;
        if (loadedCount === total) {
          imageRef.current = loadedImages;
          images.current = map;
          setIsImageLoaded(true);
        }
      };
      img.onerror = () => {
        console.error(`Không thể tải icon: ${src}`);
      };
    });
  }, []);

  return { isImageLoaded, imageRef, images };
}

export default useLoadMapIcons;
