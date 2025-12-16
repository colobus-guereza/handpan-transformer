import React from 'react';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full">
        <div className="text-center w-full">
          <h1 className="text-4xl font-bold mb-4">Handpan Transformer Environment Ready</h1>
          <p className="text-xl mb-8">System Status: Online</p>
        </div>

        <div className="w-full h-[500px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/10">
          <p className="text-gray-500">[ 3D Instrument View / Canvas Area ]</p>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row w-full justify-center">
          <button className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5">
            Test Audio Engine
          </button>
          <button className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44">
            Upload MIDI
          </button>
        </div>
      </main>
    </div>
  );
}
