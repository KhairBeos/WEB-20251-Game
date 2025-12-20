'use client';

import dynamic from 'next/dynamic'; 
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const Game = dynamic(() => import("../../View/Game"), { 
  ssr: false,
  loading: () => <div className="text-white">Loading Game Resources...</div>
});

function GamePageInner() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || '';
  const selectedSkin = searchParams.get('skin') || 'scarlet';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <Game username={username} selectedSkin={selectedSkin} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</main>}>
      <GamePageInner />
    </Suspense>
  );
}