import { useEffect, useRef, useState } from "react";
const TANK_BODY_FRAMES = [
  "/tankbody_frames/sprite-1-1.png", // Frame 1
  "/tankbody_frames/sprite-1-2.png", // Frame 2
];
const TANK_BODY_TOTAL = TANK_BODY_FRAMES.length;

function useLoadTankBody() {
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

export default useLoadTankBody;