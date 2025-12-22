import React, { memo } from 'react';
import { Tank } from '../Model/Tank';

interface ScoreboardProps {
  players: Tank[]; 
  myId?: string;   
}

const Scoreboard = ({ players, myId }: ScoreboardProps) => {
  
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const top10 = sortedPlayers.slice(0, 10);

  return (
    <div className="absolute top-4 right-4 bg-black/50 text-white p-4 rounded-lg w-64 select-none pointer-events-none z-40 backdrop-blur-sm border border-white/10">
      <h3 className="text-center font-bold mb-2 text-yellow-400 tracking-wider">LEADERBOARD</h3>
      <ul>
        {top10.map((player, index) => {
           const isMe = player.id === myId;
           
           return (
            <li 
                key={player.id} 
                className={`flex justify-between text-sm py-1 border-b border-white/10 last:border-0 ${isMe ? 'text-green-400 font-bold' : ''}`}
            >
              <span className="truncate max-w-[140px]">
                <span className="mr-2 text-gray-400 w-4 inline-block">{index + 1}.</span>
                {player.name || "Unknown"}
              </span>
              <span>{player.score.toLocaleString()}</span>
            </li>
           );
        })}
      </ul>
    </div>
  );
};

export default memo(Scoreboard);