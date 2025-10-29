import { useEffect, useRef, useState } from "react";
const FRAMES = [
  "/tankgun-frames/sprite-1-1.png", // Frame 1
  "/tankgun-frames/sprite-1-2.png", // Frame 2
  "/tankgun-frames/sprite-1-3.png", // Frame 1
  "/tankgun-frames/sprite-1-4.png", // Frame 2
  "/tankgun-frames/sprite-1-5.png", // Frame 1
  "/tankgun-frames/sprite-1-6.png", // Frame 2
  "/tankgun-frames/sprite-1-7.png", // Frame 1
  "/tankgun-frames/sprite-1-8.png", // Frame 2
  "/tankgun-frames/sprite-1-9.png", // Frame 1
  "/tankgun-frames/sprite-1-10.png", // Frame 2
  "/tankgun-frames/sprite-1-11.png", // Frame 1
];
const TOTAL_FRAMES = FRAMES.length;

function useLoadTankGun() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

    const imageRef = useRef<HTMLImageElement[]>([]);
    useEffect(() => {
        let tankBodyLoadedCount = 0;
    
        const loadedImages: HTMLImageElement[] = [];
    
        // Khởi tạo và tải từng ảnh
        FRAMES.forEach((url, index) => {
          const img = new Image();
          img.src = url;
    
          img.onload = () => {
            console.log(img.width);
            loadedImages[index] = img; // Lưu trữ ảnh vào vị trí chính xác
            tankBodyLoadedCount++;
    
            // Nếu tất cả ảnh đã tải xong
            if (tankBodyLoadedCount === TOTAL_FRAMES) {
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

export default useLoadTankGun;