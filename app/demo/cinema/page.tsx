"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Share, Video, X, Play, Clock, DollarSign, Lightbulb, VideoOff, Edit3, Plus, Gavel, User, Home, Search, Book, ShoppingCart, Settings, Repeat } from "lucide-react";

const NeobrutalistBorder = "border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all";
const NeobrutalistPrimary = "bg-[#f9f906] text-black " + NeobrutalistBorder;
const NeobrutalistWhite = "bg-white text-black " + NeobrutalistBorder;
const NeobrutalistBlack = "bg-black text-[#f9f906] " + NeobrutalistBorder;

export default function CinemaDemo() {
  const [activeView, setActiveView] = useState<"host" | "viewer">("host");
  const [directorMode, setDirectorMode] = useState<"stitch" | "auction">("auction");
  const [showSettings, setShowSettings] = useState(false);
  const [bids, setBids] = useState([
    { id: 1, user: "Marcus", amount: 45, text: "Turn the background neon pink!", isTop: true },
    { id: 2, user: "Elena", amount: 32, text: "Switch to slow motion for 10s", isTop: false },
  ]);
  const [earnings, setEarnings] = useState(2450);

  return (
    <div className="min-h-screen bg-[#f8f8f5] dark:bg-[#121212] font-sans pb-24 text-black dark:text-white">
      {/* View Toggle (Demo Only) */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2">
        <button
          onClick={() => setActiveView("host")}
          className={`${activeView === "host" ? NeobrutalistPrimary : NeobrutalistWhite} px-4 py-2 font-black uppercase text-xs`}
        >
          Host View
        </button>
        <button
          onClick={() => setActiveView("viewer")}
          className={`${activeView === "viewer" ? NeobrutalistPrimary : NeobrutalistWhite} px-4 py-2 font-black uppercase text-xs`}
        >
          Viewer View
        </button>
      </div>

      <div className="max-w-md mx-auto min-h-screen border-x-[4px] border-black bg-white dark:bg-black relative overflow-hidden flex flex-col">

        {activeView === "host" ? (
          <HostInterface
            bids={bids}
            earnings={earnings}
            directorMode={directorMode}
            onOpenSettings={() => setShowSettings(true)}
          />
        ) : (
          <ViewerInterface bids={bids} directorMode={directorMode} />
        )}

        {/* Creator Settings Overlay */}
        {showSettings && (
          <div className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end">
            <div className="w-full bg-[#f9f906] border-t-4 border-black p-6 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase italic italic tracking-tighter text-black">Performance Controls</h2>
                <button onClick={() => setShowSettings(false)} className="bg-black text-[#f9f906] p-1 border-2 border-black">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-black mb-3 block tracking-widest">Global Interaction Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setDirectorMode("stitch")}
                      className={`p-4 border-[3px] border-black text-left flex flex-col gap-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${directorMode === "stitch" ? 'bg-black text-[#f9f906]' : 'bg-white text-black'}`}
                    >
                      <Repeat className="w-6 h-6" />
                      <div>
                        <p className="font-black text-xs uppercase leading-none mb-1">Continuous Stitch</p>
                        <p className="text-[9px] font-bold leading-tight opacity-80">Rhythmic, shot-by-shot assembly. Multiple performance tasks.</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setDirectorMode("auction")}
                      className={`p-4 border-[3px] border-black text-left flex flex-col gap-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${directorMode === "auction" ? 'bg-black text-[#f9f906]' : 'bg-white text-black'}`}
                    >
                      <Gavel className="w-6 h-6" />
                      <div>
                        <p className="font-black text-xs uppercase leading-none mb-1">Direct Auction</p>
                        <p className="text-[9px] font-bold leading-tight opacity-80">Single prompt triggers. Highest bidder directs immediately.</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-black mb-1 block tracking-widest text-center opacity-60">Performance Thresholds</label>
                  <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center text-black">
                    <span className="font-black text-xs uppercase italic tracking-tighter">Minimum Entry Bid</span>
                    <span className="font-black text-xl">$5.00</span>
                  </div>
                  <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center text-black">
                    <span className="font-black text-xs uppercase italic tracking-tighter">Task Performance Buffer</span>
                    <span className="font-black text-xl">15s</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-black text-[#f9f906] py-4 border-[3px] border-black font-black uppercase italic tracking-widest text-sm shadow-[4px_4px_0px_0px_#888] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  Confirm Live Settings
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function HostInterface({ bids, earnings, directorMode, onOpenSettings }: { bids: any[], earnings: number, directorMode: string, onOpenSettings: () => void }) {
  const topBid = bids.find(b => b.isTop);

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Header */}
      <nav className="p-4 border-b-4 border-black bg-[#f9f906] flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-black p-1 border-2 border-white shadow-[2px_2px_0px_0px_white]">
            <Video className="text-[#f9f906] w-5 h-5" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter italic text-black shrink-0">Cinema_Stitch</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenSettings} className="bg-black text-[#f9f906] p-1.5 border-2 border-black hover:scale-105 transition-transform active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Settings className="w-4 h-4" />
          </button>
          <div className="bg-black text-[#f9f906] px-2 py-1 border-2 border-black font-black text-[10px] uppercase">
            {directorMode === "stitch" ? "STITCH_MODE" : "AUCTION_MODE"}
          </div>
        </div>
      </nav>

      {/* Main Video Area */}
      <div className="flex-1 bg-black relative">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop')" }}
        />

        {/* Dynamic HUD based on Mode */}
        <div className="absolute top-6 left-6 right-6 space-y-4">
          <div className={`bg-[#f9f906] text-black p-2 text-[10px] font-black uppercase border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center`}>
            <span>{directorMode === "stitch" ? "TIMELINE: QUEUED (3/5)" : "TOP DIRECTOR"}</span>
            <span className="bg-black text-[#f9f906] px-1">{topBid?.user.toUpperCase()}</span>
          </div>

          <div className={`bg-white text-black p-5 border-[3px] border-black shadow-[4px_4px_0px_0px_#f9f906] relative`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">
              {directorMode === "stitch" ? "ACTIVE TASK SEQUENCE" : "CURRENT COMMAND"}
            </p>
            <p className="text-xl font-black italic uppercase leading-tight">
              {directorMode === "stitch" ? "1. Neon Light 2. Slow Pan 3. Zoom" : `"${topBid?.text}"`}
            </p>

            {directorMode === "stitch" && (
              <div className="mt-4 flex gap-1.5 h-1.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`flex-1 border border-black ${i <= 3 ? 'bg-black' : 'bg-gray-200'}`} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Feed */}
        <div className="absolute left-6 bottom-32 space-y-3 max-w-[200px]">
          {bids.map(bid => (
            <div key={bid.id} className="flex items-center gap-3 animate-slide-right group">
              <div className="w-10 h-10 bg-black border-2 border-[#f9f906] shrink-0 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <img src={`https://i.pravatar.cc/150?u=${bid.user}`} alt="User" className="grayscale group-hover:grayscale-0 transition-all" />
              </div>
              <div className="bg-white/10 backdrop-blur-md px-2 py-1.5 border border-white/20 text-[10px] font-black text-white uppercase italic tracking-tighter">
                {bid.user} {directorMode === "stitch" ? "added shot" : "bid $" + bid.amount}
              </div>
            </div>
          ))}
        </div>

        {/* Earnings Badge */}
        <div className="absolute bottom-10 right-6 bg-[#f9f906] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[4deg] text-center text-black">
          <p className="text-[8px] font-black uppercase leading-none mb-1 opacity-60">Creator Vault</p>
          <p className="text-2xl font-black leading-none">${earnings.toLocaleString()}</p>
        </div>

        {/* Host Action Buttons */}
        <div className="absolute bottom-10 left-6 right-36 flex gap-3">
          {directorMode === "stitch" ? (
            <button className="flex-1 bg-white text-black px-4 py-4 border-[3px] border-black font-black uppercase italic text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2">
              <Video className="w-4 h-4" /> RECORD SEGMENT
            </button>
          ) : (
            <button className="flex-1 bg-white text-black px-4 py-4 border-[3px] border-black font-black uppercase italic text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2">
              <Gavel className="w-4 h-4" /> CLEAR COMMAND
            </button>
          )}
        </div>

        {/* Rec Pulse */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
          <span className="text-[10px] font-black text-white uppercase tracking-tighter">LIVE • 00:22:15</span>
        </div>
      </div>
    </div>
  );
}

function ViewerInterface({ bids, directorMode }: { bids: any[], directorMode: string }) {
  const topBid = bids.find(b => b.isTop);

  return (
    <div className="flex-1 flex flex-col bg-[#f8f8f5] dark:bg-[#121212]">
      {/* Top Header */}
      <nav className="p-4 border-b-4 border-black bg-white dark:bg-black flex items-center justify-between sticky top-0 z-50">
        <button className={NeobrutalistWhite + " p-2"}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter italic">Cinema Studio</h1>
        <button className={NeobrutalistPrimary + " p-2"}>
          <Share className="w-5 h-5" />
        </button>
      </nav>

      {/* Preview Area */}
      <div className="p-4 bg-zinc-100 dark:bg-zinc-900 border-b-4 border-black">
        <div className="aspect-video bg-black border-[3px] border-[#f9f906] shadow-[4px_4px_0px_0px_#f9f906] relative overflow-hidden group">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop')" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="bg-[#f9f906] text-black w-14 h-14 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
              <Play className="w-8 h-8 fill-black" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <div className="bg-black/80 px-2 py-0.5 border border-white/20 text-[8px] font-black text-[#f9f906] uppercase">
              {directorMode.toUpperCase()}_VIEW
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Commands */}
      <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar border-b-4 border-black bg-[#f9f906]/5">
        <CommandButton icon={<VideoOff />} label="New Angle" color="bg-white" />
        <CommandButton icon={<Lightbulb />} label="Lighting" color="bg-white" />
        <CommandButton icon={<Edit3 />} label="Director Cut" color="bg-white" border="border-dashed" />
        <CommandButton icon={<Plus />} label="Add FX" color="bg-[#f9f906]" />
      </div>

      {/* Bidding/Stacking Desk */}
      <div className="flex-1 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">
            {directorMode === "stitch" ? "Performance Stack" : "The Director's Chair"}
          </h2>
          <div className="bg-black text-[#f9f906] px-2 py-0.5 border-2 border-black text-[9px] font-black">
            {directorMode === "stitch" ? "QUEUE" : "BIDDING"}
          </div>
        </div>

        <div className="space-y-4">
          {/* Active Card */}
          <div className={`bg-white dark:bg-zinc-900 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex gap-4 items-center`}>
            <div className="w-14 h-14 border-[3px] border-black grayscale overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <img src={`https://i.pravatar.cc/150?u=${topBid?.user}`} alt="Winner" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-black text-[10px] uppercase tracking-widest text-[#f9f906] bg-black px-1">
                  {directorMode === "stitch" ? "Recent Addition" : "Current Top Bid"}
                </span>
                <span className="font-black text-lg">${topBid?.amount}.00</span>
              </div>
              <p className="text-sm font-black uppercase leading-[1.1] mt-1 italic italic">"{topBid?.text}"</p>
            </div>
          </div>

          <div className="relative mt-2">
            <input
              className="w-full bg-white dark:bg-zinc-900 border-[3px] border-black p-4 pr-16 text-xs font-black uppercase focus:ring-2 focus:ring-[#f9f906] outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:text-white"
              placeholder={directorMode === "stitch" ? "ADD TO PERFORMANCE SEQUENCE..." : "ENTER DIRECTORIAL COMMAND..."}
            />
            <button className="absolute right-3 top-2.5 bottom-2.5 px-4 bg-[#f9f906] text-black border-[2px] border-black font-black text-[10px] uppercase hover:bg-black hover:text-[#f9f906] transition-colors">
              {directorMode === "stitch" ? "ADD" : "BID"}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="flex border-t-4 border-black bg-white dark:bg-black p-2 mb-safe">
        <NavButton active icon={<Video />} label="Stream" />
        <NavButton icon={<Gavel />} label="Direct" />
        <NavButton icon={<Clock />} label="Book" />
        <NavButton icon={<User />} label="Profile" />
      </nav>
    </div>
  );
}

function CommandButton({ icon, label, color, border = "" }: { icon: any, label: string, color: string, border?: string }) {
  return (
    <button className={`flex flex-col items-center justify-center gap-1 shrink-0 ${color} border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-5 py-4 ${border} hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all`}>
      <div className="w-6 h-6">{icon}</div>
      <p className="text-[9px] font-black uppercase whitespace-nowrap tracking-tighter">{label}</p>
    </button>
  );
}

function NavButton({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex-1 flex flex-col items-center justify-center py-2 ${active ? 'text-[#f9f906] bg-black border-[2px] border-black rounded-sm' : 'text-gray-500 opacity-60 hover:opacity-100 transition-opacity'}`}>
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">{label}</span>
    </button>
  );
}
