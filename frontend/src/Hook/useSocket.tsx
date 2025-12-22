// hooks/useSocket.ts
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../GlobalSetting';

const generateSessionId = () => {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const useSocket = () => {
  // useRef được sử dụng để giữ instance socket giữa các lần render
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Nếu socket đã tồn tại, không cần tạo lại
    if (socketRef.current) return;

    // Chỉ tạo kết nối nếu code đang chạy trên trình duyệt (window là undefined trong SSR)
    if (typeof window !== 'undefined') {

      // Lấy sessionId từ localStorage 
      let sessionId = localStorage.getItem('tank_session_id');
      // Nếu chưa có yêu cầu quay lại đăng nhập để tạo mới
      if (!sessionId) {
        alert('Session expired or not found. Please log in again.');
        window.location.href = '/';
        return;
      }
      const socket = io(SOCKET_URL, {
        // Gửi SessionID lên server
        auth: {
          sessionId: sessionId,
        },
        reconnection: true, // Tự động kết nối lại khi rớt mạng
        // query: { name: "ano" }
      });
      

      socketRef.current = socket;
      socket.connect(); // Bắt đầu kết nối

      socket.on('connect', () => {
        console.log('Socket client connected successfully!');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket client disconnected.');
        alert('Session expired or not found. Please log in again.');
        window.location.href = '/';
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