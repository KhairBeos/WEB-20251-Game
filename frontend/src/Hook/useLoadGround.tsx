import { useEffect, useRef, useState } from "react";
const FRAMES = [
  "/map/ground.png",
  
];
const TOTAL_FRAMES = FRAMES.length;

function useLoadGround() {
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

export default useLoadGround;