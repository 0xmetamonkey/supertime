'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Clock, ArrowRight, Zap, Target } from 'lucide-react';

export default function RevenueCalculator() {
  const [rate, setRate] = useState(100); // TKN per minute
  const [minsPerDay, setMinsPerDay] = useState(120); // Daily target
  const [creators, setCreators] = useState(1); // Scale target

  const creatorShare = 0.60;
  const platformShare = 0.40;

  const dailyVolume = creators * minsPerDay * rate;
  const creatorDaily = dailyVolume * creatorShare / creators;
  const platformDailyTotal = dailyVolume * platformShare;

  const monthlyCreator = creatorDaily * 30;
  const monthlyPlatform = platformDailyTotal * 30;

  return (
    <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-4xl mx-auto font-mono text-black">
      <div className="flex items-center gap-4 mb-10 border-b-4 border-black pb-6">
        <div className="bg-neo-yellow p-3 border-2 border-black">
          <Calculator className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">Revenue Projection Matrix</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Unit-Economics: 60/40 Split Strategy</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* INPUTS */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Rate (TKN/Min)
              </label>
              <span className="text-2xl font-black italic">₹{rate}</span>
            </div>
            <input
              type="range" min="10" max="500" step="10"
              value={rate} onChange={(e) => setRate(parseInt(e.target.value))}
              className="w-full h-3 bg-zinc-200 rounded-none border-2 border-black appearance-none cursor-pointer accent-black"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" /> Mins Per Day
              </label>
              <span className="text-2xl font-black italic">{minsPerDay} MINS</span>
            </div>
            <input
              type="range" min="10" max="480" step="10"
              value={minsPerDay} onChange={(e) => setMinsPerDay(parseInt(e.target.value))}
              className="w-full h-3 bg-zinc-200 rounded-none border-2 border-black appearance-none cursor-pointer accent-black"
            />
          </div>

          <div className="space-y-4 pt-6 border-t-2 border-black border-dashed">
            <div className="flex justify-between items-end text-neo-pink">
              <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3 h-3" /> Scale (Creators)
              </label>
              <span className="text-2xl font-black italic">{creators}</span>
            </div>
            <input
              type="range" min="1" max="100" step="1"
              value={creators} onChange={(e) => setCreators(parseInt(e.target.value))}
              className="w-full h-3 bg-zinc-200 rounded-none border-2 border-black appearance-none cursor-pointer accent-neo-pink"
            />
          </div>
        </div>

        {/* OUTPUTS */}
        <div className="space-y-4">
          <div className="bg-neo-green border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Creator Daily Earning (60%)</p>
            <p className="text-4xl font-black italic tracking-tighter">₹{creatorDaily.toLocaleString()}</p>
            <div className="mt-4 pt-4 border-t-2 border-black/10 flex justify-between items-center">
              <span className="text-[8px] font-bold uppercase opacity-50">Monthly Potential</span>
              <span className="text-lg font-black">₹{monthlyCreator.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-black text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(34,197,94,0.4)]">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60 text-neo-green">Platform Daily Revenue (40%)</p>
            <p className="text-4xl font-black italic tracking-tighter text-neo-green">₹{platformDailyTotal.toLocaleString()}</p>
            <div className="mt-4 pt-4 border-t-2 border-white/10 flex justify-between items-center">
              <span className="text-[8px] font-bold uppercase opacity-50">System Monthly Yield</span>
              <span className="text-lg font-black text-neo-green">₹{monthlyPlatform.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 bg-zinc-50 border-2 border-black border-dashed flex items-center justify-between group cursor-pointer hover:bg-white transition-colors">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">View Detailed Projections</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      <div className="mt-12 p-4 bg-zinc-900 text-white flex items-center justify-between rounded-lg">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-neo-yellow fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest">Target Velocity: {creators === 100 ? 'MAXIMUM' : 'ACCELERATING'}</span>
        </div>
        <span className="text-[10px] font-bold opacity-40 uppercase">Talk-Time Matrix v2.0</span>
      </div>
    </div>
  );
}
