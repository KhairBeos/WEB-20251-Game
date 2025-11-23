'use client';

import dynamic from 'next/dynamic'; 

const Game = dynamic(() => import("../../View/Game"), { 
  ssr: false,
  loading: () => <div className="text-white">Loading Game Resources...</div>
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <Game /> 
    </main>
  );
}