"use client";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Game from '../../View/Game';

function GameContent() {
    const searchParams = useSearchParams();
    
    const playerName = searchParams.get('username') || "Anonymous"; 

    return <Game playerName={playerName} />;
}

export default function GamePage() {
    return (
        <Suspense fallback={<div className="text-white text-center mt-10">Đang tải chiến trường...</div>}>
            <GameContent />
        </Suspense>
    );
}