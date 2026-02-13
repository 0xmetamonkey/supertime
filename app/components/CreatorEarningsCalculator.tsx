'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Wallet, Zap, ArrowRight } from 'lucide-react';

export default function CreatorEarningsCalculator() {
  const [rate, setRate] = useState(100); // ₹ per minute
  const [hoursPerDay, setHoursPerDay] = useState(2); // Daily hours

  const creatorShare = 0.60;
  const minutesPerDay = hoursPerDay * 60;
  const dailyEarning = minutesPerDay * rate * creatorShare;
  const monthlyEarning = dailyEarning * 30;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-[2.5rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-zinc-100 font-sans text-zinc-900">
      <div className="space-y-2 mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4">
          <Sparkles className="w-3 h-3" /> Potential Yield
        </div>
        <h2 className="text-4xl font-black tracking-tight">How much will you <span className="italic">earn?</span></h2>
        <p className="text-zinc-400 font-medium lowercase">Adjust the sliders to see your projected take-home.</p>
      </div>

      <div className="space-y-12">
        {/* RATE SLIDER */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Rate per minute</label>
            <div className="text-right">
              <span className="text-3xl font-black text-zinc-900">₹{rate}</span>
              <span className="text-xs font-bold text-zinc-300 ml-1 uppercase">/min</span>
            </div>
          </div>
          <input
            type="range" min="10" max="500" step="10"
            value={rate} onChange={(e) => setRate(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        {/* TIME SLIDER */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Time per day</label>
            <div className="text-right">
              <span className="text-3xl font-black text-zinc-900">{hoursPerDay}</span>
              <span className="text-xs font-bold text-zinc-300 ml-1 uppercase">Hours</span>
            </div>
          </div>
          <input
            type="range" min="0.5" max="8" step="0.5"
            value={hoursPerDay} onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        {/* RESULTS CARD */}
        <div className="relative group p-1">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-100 via-orange-100 to-rose-100 rounded-[2rem] blur opacity-50"></div>
          <div className="relative bg-white border border-zinc-100 rounded-[2rem] p-8 flex flex-col items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Monthly Net Earning (60% Split)</p>
            <h3 className="text-6xl font-black text-zinc-900 tracking-tighter mb-8">
              ₹{monthlyEarning.toLocaleString()}
            </h3>

            <button className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-rose-500 transition-all flex items-center justify-center gap-3">
              Apply as Creator <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-8 pt-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
            <Zap className="w-3 h-3 text-neo-yellow fill-current" /> Instant Settlements
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
            <Wallet className="w-3 h-3 text-neo-blue fill-current" /> Zero Hidden Fees
          </div>
        </div>
      </div>
    </div>
  );
}
