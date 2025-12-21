"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';



function GameHome() {
   
    const [tankName, setTankName] = useState('');
    const router = useRouter();

    const handleStartGame = () => {
        if (!tankName.trim()) return; 
        const encodedTankName = encodeURIComponent(tankName);

        router.push(`/game?name=${encodedTankName}`); 
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-800">
            <h1 className="text-white text-4xl">Welcome to the Tank Battle Game!</h1>
            <p className="text-gray-300 mt-4">Get ready to join the battlefield and show your skills!</p>
            <input type="text" placeholder="Enter your tank name" className="mt-4 p-2 rounded" 
            onChange={(e) => setTankName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStartGame()}/>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleStartGame}
            >
                Start Game
            </button>
        </div>
    );
}

export default GameHome;