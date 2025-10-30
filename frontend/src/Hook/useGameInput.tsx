import { useCallback, useEffect, useRef } from 'react';

// Định nghĩa kiểu cho KeyMap
interface KeyMap {
    [key: string]: boolean;
}

/**
 * Custom Hook để xử lý và theo dõi trạng thái các phím W, A, S, D được nhấn.
 * @returns [keysPressed, handleKeyDown, handleKeyUp]
 */
export const useGameInput = () => {
    // 1. Lưu trữ trạng thái phím (dùng useRef để tránh re-render)
    const keysPressed = useRef<KeyMap>({});

    // 2. Tạo hàm xử lý keydown ổn định
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (['a', 'w', 's', 'd','j'].includes(key)) {
            // Ngăn chặn hành vi mặc định của trình duyệt (cuộn trang)
            event.preventDefault(); 
            keysPressed.current[key] = true;
        }
    }, []); // Dependency rỗng: Hàm này ổn định suốt vòng đời component

    // 3. Tạo hàm xử lý keyup ổn định
    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (['a', 'w', 's', 'd','j'].includes(key)) {
            keysPressed.current[key] = false;
        }
    }, []); // Dependency rỗng: Hàm này ổn định suốt vòng đời component

    // 4. Thiết lập Event Listeners (chỉ chạy một lần)
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Hàm dọn dẹp (cleanup)
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]); // Đảm bảo dùng các hàm đã được memoize (useCallback)

    return keysPressed;
};
