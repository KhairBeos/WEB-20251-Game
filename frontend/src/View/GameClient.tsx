// pages/game.tsx hoặc components/GameClient.tsx
"use client"

import { useState, useEffect } from "react";
import { useSocket } from "../Hook/useSocket";


const GameClient = () => {  
  
  const { socket, isConnected } = useSocket();
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    // Đảm bảo socket tồn tại và được kết nối trước khi lắng nghe
    if (socket && isConnected) {
      // 1. Lắng nghe sự kiện từ Server
      socket.on('gameState', (state) => {
        // Cập nhật trạng thái game nhận được từ server
        setGameState(state); 
        console.log('Received Game State:', state);
      });

      // CLEANUP: Tắt lắng nghe khi component bị hủy
      return () => {
        socket.off('gameState');
      };
    }
  }, [socket, isConnected]);

  
  // Xử lý Input (Ví dụ: Gửi sự kiện di chuyển)
  const handleMove = (direction: string) => {
    if (socket) {
      socket.emit('playerInput', { direction });
      console.log(`Sending input: ${direction}`);
    }
  };

  if (!isConnected) {
    return <div>Connecting to game server...</div>;
  }

  return (
    <div>
      <h1>Game Client (Connected)</h1>
      <p>Current Status: {isConnected ? 'Online' : 'Offline'}</p>
      {gameState && (
        <pre>{JSON.stringify(gameState, null, 2)}</pre>
      )}
      <button onClick={() => handleMove('up')}>Move Up</button>
      <button onClick={() => handleMove('down')}>Move Down</button>
    </div>
  );
};

export default GameClient;