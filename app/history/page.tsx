'use client';

import React, { useState } from 'react';
import LandingPageClient from '../LandingPageClient';
import { Zap, Sparkles, Heart, Globe, CircleDollarSign, Palette, ArrowRight, ShieldCheck } from 'lucide-react';

// Mocked Version 1 (Minimalist)
const Version1 = () => (
  <div className="min-h-screen bg-white text-black p-20 flex flex-col items-center justify-center font-sans">
    <div className="border-4 border-black bg-black p-8 shadow-[8px_8px_0px_0px_#000] max-w-xl w-full text-white">
      <h1 className="text-4xl font-black uppercase mb-4">Supertime</h1>
      <p className="mb-8 font-bold">The original minimalist claim hub.</p>
      <div className="flex bg-white border-4 border-black p-4">
        <span className="text-zinc-400 font-bold mr-2">supertime.wtf/</span>
        <input disabled placeholder="YOU" className="bg-transparent outline-none text-black font-black" />
      </div>
      <button className="w-full mt-4 bg-white text-black font-black py-4 uppercase border-4 border-black">Claim Now</button>
    </div>
  </div>
);

// Mocked Version 2 (Energy Exchange - Dark Mode)
const Version2 = () => (
  <div className="min-h-screen bg-[#0A0A0B] text-white p-20 flex flex-col items-center justify-center font-sans overflow-hidden relative">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--neo-blue)_0%,_transparent_70%)] opacity-20 blur-[120px]" />
    <div className="relative z-10 text-center">
      <div className="inline-block px-4 py-1 border-2 border-white bg-neo-yellow mb-4 text-black font-black uppercase text-xs">Energy Exchange</div>
      <h1 className="text-8xl font-black uppercase tracking-tighter mb-6">
        Turn your <span className="text-neo-pink">time</span> into <span className="text-neo-blue italic">art.</span>
      </h1>
      <div className="max-w-xl mx-auto bg-neutral-900 border-4 border-white p-6 shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
        <div className="flex items-center text-2xl font-black">
          <span className="text-zinc-500">supertime.wtf/</span>
          <span className="text-white">...</span>
        </div>
      </div>
    </div>
  </div>
);

export default function HistoryPage() {
  const [version, setVersion] = useState<'v1' | 'v2' | 'v3'>('v3');

  return (
    <div className="relative">
      <div className="fixed top-24 left-6 z-[100] flex flex-col gap-2 p-2 bg-black/80 backdrop-blur-md border-2 border-white rounded-xl shadow-2xl">
        <button
          onClick={() => setVersion('v1')}
          className={`px-4 py-2 rounded-lg font-black uppercase text-xs transition-all ${version === 'v1' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
        >
          V1 (Original)
        </button>
        <button
          onClick={() => setVersion('v2')}
          className={`px-4 py-2 rounded-lg font-black uppercase text-xs transition-all ${version === 'v2' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
        >
          V2 (Energy)
        </button>
        <button
          onClick={() => setVersion('v3')}
          className={`px-4 py-2 rounded-lg font-black uppercase text-xs transition-all ${version === 'v3' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
        >
          V3 (Current Revert)
        </button>
        <div className="h-px bg-white/20 my-1" />
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 rounded-lg font-black uppercase text-xs bg-neo-green text-black hover:scale-105 transition-all"
        >
          Back to Live
        </button>
      </div>

      <div className="border-b-4 border-black bg-neo-yellow p-4 text-center font-black uppercase tracking-widest text-xs sticky top-0 z-[90]">
        Layout History Gallery — Currently Viewing: {version === 'v1' ? 'Version 1' : version === 'v2' ? 'Version 2' : 'Version 3'}
      </div>

      <div className="pointer-events-none opacity-50 select-none">
        {version === 'v1' && <Version1 />}
        {version === 'v2' && <Version2 />}
        {version === 'v3' && <LandingPageClient session={null} savedUsername={null} />}
      </div>

      {/* Enable interactions for v3 since it's the live component */}
      <div className={version === 'v3' ? 'block' : 'hidden'}>
        <LandingPageClient session={null} savedUsername={null} />
      </div>
    </div>
  );
}
