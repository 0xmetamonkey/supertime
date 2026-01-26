'use client';

import React, { useState } from 'react';

export default function PriceSlider() {
  const [tokens, setTokens] = useState(100);

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm">
      <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Set Your Price</h3>
      <div className="flex justify-between items-center mb-6">
        <span className="text-4xl font-black text-white">{tokens}</span>
        <span className="text-zinc-500 text-sm font-mono text-right">TOKENS / MIN</span>
      </div>

      <input
        type="range"
        min="10"
        max="1000"
        step="10"
        value={tokens}
        onChange={(e) => setTokens(parseInt(e.target.value))}
        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
      />

      <div className="mt-6 pt-6 border-t border-zinc-800 text-sm text-zinc-400">
        You earn approx. <span className="text-white font-bold">₹{(tokens * 0.85).toFixed(0)}</span> per minute.
      </div>
    </div>
  );
}