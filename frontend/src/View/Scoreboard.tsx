import React, { useEffect, useState } from 'react';

interface ScoreEntry {
  id: string;
  name: string;
  score: number;
}

// Danh sách tên giả
const FAKE_NAMES = [
  "ProTanker", "NoobMaster69", "DiepFan", "SniperElite", 
  "SpeedyBoi", "TankyMcTank", "Destroyer", "Alpha", "Omega", "Guest_123"
];

const Scoreboard = () => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    // 1. Khởi tạo dữ liệu giả
    const initialScores = FAKE_NAMES.map((name, index) => ({
      id: `fake_${index}`,
      name: name,
      score: Math.floor(Math.random() * 5000) + 500 // Điểm ngẫu nhiên từ 500-5500
    }));
    
    // Sắp xếp giảm dần theo điểm
    setScores(initialScores.sort((a, b) => b.score - a.score));

    // 2. Giả lập cập nhật Realtime
    const interval = setInterval(() => {
      setScores(prevScores => {
        const updatedScores = prevScores.map(player => {
          if (Math.random() > 0.7) {
            return {
              ...player,
              score: player.score + Math.floor(Math.random() * 100)
            };
          }
          return player;
        });

        return [...updatedScores].sort((a, b) => b.score - a.score);
      });
    }, 800); // Cập nhật mỗi 0.8 giây

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-black/50 backdrop-blur-sm text-white p-3 rounded-lg min-w-[200px] pointer-events-none select-none border border-white/10 shadow-lg z-50">
      <h3 className="text-center font-bold text-lg border-b border-white/20 mb-2 pb-1 font-mono tracking-wider">
        LEADERBOARD
      </h3>
      <ul className="flex flex-col gap-1">
        {scores.map((player, index) => (
          <li key={player.id} className="flex justify-between items-center text-sm font-mono">
            <span className={`${index === 0 ? 'text-yellow-400 font-bold' : 'text-gray-200'}`}>
              {index + 1}. {player.name}
            </span>
            <span className="text-gray-400 ml-4">
              {player.score.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 text-xs text-center text-gray-500 italic">
        Demo Data
      </div>
    </div>
  );
};

export default Scoreboard;