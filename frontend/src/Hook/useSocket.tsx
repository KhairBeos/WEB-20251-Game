// hooks/useSocket.ts
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001'; // Thay bằng URL NestJS của bạn

type SocketAuth = Record<string, any>;

export const useSocket = (authPayload?: SocketAuth) => {
  // useRef được sử dụng để giữ instance socket giữa các lần render
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const authKey = JSON.stringify(authPayload || {});

  useEffect(() => {
    // Hủy socket cũ nếu auth thay đổi
    if (socketRef.current) {
      socketRef.current.off('connect');
      socketRef.current.off('disconnect');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Chỉ tạo kết nối nếu code đang chạy trên trình duyệt (window là undefined trong SSR)
    if (typeof window !== 'undefined') {
      const socket = io(SOCKET_URL, {
        // Thêm các options như transports, authentication token nếu cần
        autoConnect: false, // Ngăn kết nối ngay lập tức
        auth: authPayload,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authKey]);

  // Trả về instance socket và trạng thái kết nối
  return { socket: socketRef.current, isConnected };
};
