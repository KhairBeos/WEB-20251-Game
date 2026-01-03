import { useEffect, useRef, useState } from "react";
const SKIN_IDS = ["scarlet", "desert", "ocean", "lemon", "violet"];
const FRAME_COUNT = 2;

// Map skin id to file prefix
const SKIN_PREFIX_MAP: Record<string, string> = {
  scarlet: "sprite-1-",
  desert: "desert1.",
  ocean: "ocean1.",
  lemon: "lemon1.",
  violet: "violet1.",
};

function useLoadTankBody() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  // Store gun frames per skin: { scarlet: [img1, img2...], desert: [...], ... }
  const skinGunFramesRef = useRef<Record<string, HTMLImageElement[]>>({});
  // Also keep default frames for backwards compat
  const imageRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    const totalFramesToLoad = SKIN_IDS.length * FRAME_COUNT;
    let loadedCount = 0;
    const allFrames: Record<string, HTMLImageElement[]> = {};

    SKIN_IDS.forEach((skinId) => {
      allFrames[skinId] = [];
      const prefix = SKIN_PREFIX_MAP[skinId] || "sprite-1-";

      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src = `/tankbody-frames/${prefix}${i}.png`;

        img.onload = () => {
          allFrames[skinId][i - 1] = img;
          loadedCount++;

          if (loadedCount === totalFramesToLoad) {
            skinGunFramesRef.current = allFrames;
            // Set default (scarlet) frames for backwards compat
            imageRef.current = allFrames["scarlet"] || [];
            setIsImageLoaded(true);
          }
        };

        img.onerror = () => {
          console.error(`Cannot load gun frame: /tankbody-frames/${prefix}${i}.png`);
          loadedCount++;
          if (loadedCount === totalFramesToLoad) {
            skinGunFramesRef.current = allFrames;
            imageRef.current = allFrames["scarlet"] || [];
            setIsImageLoaded(true);
          }
        };
      }
    });
  }, []);

  return { isImageLoaded, imageRef, skinGunFramesRef };
}

export default useLoadTankBody;