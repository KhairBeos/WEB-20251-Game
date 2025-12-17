// hooks/useSocket.ts
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../GlobalSetting';



export const useSocket = () => {
  // useRef được sử dụng để giữ instance socket giữa các lần render
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Nếu socket đã tồn tại, không cần tạo lại
    if (socketRef.current) return;

    // Chỉ tạo kết nối nếu code đang chạy trên trình duyệt (window là undefined trong SSR)
    if (typeof window !== 'undefined') {
      const socket = io(SOCKET_URL, {
        // Thêm các options như transports, authentication token nếu cần
        // autoConnect: false, // Ngăn kết nối ngay lập tức
        query: {
          name : "ano", // Ví dụ thêm tên người chơi ngẫu nhiên
        }
      });

      socketRef.current = socket;
      socket.connect(); // Bắt đầu kết nối

      socket.on('connect', () => {
        console.log('Socket client connected successfully!');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket client disconnected.');
        setIsConnected(false);
      });

      // CLEANUP: Đóng kết nối khi component bị hủy (unmount)
      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, []);

  // Trả về instance socket và trạng thái kết nối
  return { socket: socketRef.current, isConnected };
};