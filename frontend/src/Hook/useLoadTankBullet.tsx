import { useEffect, useRef, useState } from "react";
const TANK_BODY_FRAMES = [
  "/bullet1_frames/tile000.png", // Frame 1
  "/bullet1_frames/tile001.png",
  "/bullet1_frames/tile002.png", // Frame 2
  "/bullet1_frames/tile003.png", // Frame 2

  
   
];
const TANK_BODY_TOTAL = TANK_BODY_FRAMES.length;

function useLoadTankBullet() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

    const imageRef = useRef<HTMLImageElement[]>([]);
    useEffect(() => {
        let tankBodyLoadedCount = 0;
    
        const loadedImages: HTMLImageElement[] = [];
    
        // Khởi tạo và tải từng ảnh
        TANK_BODY_FRAMES.forEach((url, index) => {
          const img = new Image();
          img.src = url;
    
          img.onload = () => {
            console.log(img.width);
            loadedImages[index] = img; // Lưu trữ ảnh vào vị trí chính xác
            tankBodyLoadedCount++;
    
            // Nếu tất cả ảnh đã tải xong
            if (tankBodyLoadedCount === TANK_BODY_TOTAL) {
              imageRef.current = loadedImages;
              setIsImageLoaded(true); // Đánh dấu là đã sẵn sàng
            }
          };
    
          img.onerror = () => {
            console.error(`Không thể tải frame ảnh: ${url}`);
          };
        });
    
      }, []);
    return ({isImageLoaded, imageRef});
}

export default useLoadTankBullet;