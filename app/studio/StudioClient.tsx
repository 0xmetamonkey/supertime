'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Settings,
  Video,
  Mic,
  Globe,
  LayoutDashboard,
  LogOut,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { logout, checkAvailability, claimUsername } from '../actions';
import dynamic from 'next/dynamic';
const AgoraCall = dynamic(() => import('../components/AgoraCall'), { ssr: false });
import { useTheme } from '../context/ThemeContext';
import WalletManager from '../components/WalletManager';
import ThemeToggle from '../components/ThemeToggle';

export default function StudioClient({ username, session, initialSettings }: { username: string | null, session: any, initialSettings?: any }) {
  const router = useRouter();
  const [isLive, setIsLive] = useState(initialSettings?.isLive ?? false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [pendingVideoRate, setPendingVideoRate] = useState(initialSettings?.videoRate ?? 100);
  const [pendingAudioRate, setPendingAudioRate] = useState(initialSettings?.audioRate ?? 50);
  const [pendingSocials, setPendingSocials] = useState(initialSettings?.socials ?? { instagram: '', x: '', youtube: '', website: '' });
  const [pendingProfileImage, setPendingProfileImage] = useState(initialSettings?.profileImage || '');
  const [pendingTemplates, setPendingTemplates] = useState<any[]>(initialSettings?.templates || []);
  const [artifacts, setArtifacts] = useState<any[]>(initialSettings?.artifacts || []);
  const [isUploading, setIsUploading] = useState(false);
  const [roomType, setRoomType] = useState<'audio' | 'video'>(initialSettings?.roomType || 'audio');
  const [isRoomFree, setIsRoomFree] = useState<boolean>(initialSettings?.isRoomFree ?? true);

  // Visitor
  const [claimName, setClaimName] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  const saveSettings = async () => {
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        body: JSON.stringify({
          socials: pendingSocials,
          videoRate: pendingVideoRate,
          audioRate: pendingAudioRate,
          profileImage: pendingProfileImage,
          templates: pendingTemplates,
          roomType,
          isRoomFree,
        })
      });
      setShowSettings(false);
    } catch (e) {
      alert("Failed to save settings");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    setIsUploading(true);
    const file = event.target.files[0];
    try {
      const response = await fetch(`/api/upload?filename=${file.name}`, { method: 'POST', body: file });
      const newBlob = await response.json();
      setPendingProfileImage(newBlob.url);
    } catch (e) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimName) return;
    setClaimError('');
    setClaimLoading(true);
    try {
      const isAvailable = await checkAvailability(claimName);
      if (!isAvailable) {
        setClaimError('Username taken. Try another?');
        setClaimLoading(false);
        return;
      }
      await claimUsername(claimName);
      window.location.reload();
    } catch (e: any) {
      setClaimError(e.message || "Something went wrong.");
      setClaimLoading(false);
    }
  };

  useEffect(() => {
    if (!username || !isLive || isCalling) {
      if (!isLive) setActiveChannelName(null);
      return;
    }
    // If Live and not in a private call, enter the Public Room (Studio Space)
    setActiveChannelName(`room-${username}`);
  }, [isLive, isCalling, username]);

  useEffect(() => {
    if (!username || !isLive || isCalling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/call/signal?username=${username}`);
        const data = await res.json();
        if (data.incoming) setIncomingCall(data.incoming);
      } catch (e) { }
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive, isCalling, username]);

  const handleAcceptCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setIsCalling(true);
    setActiveChannelName(incomingCall.channelName);
    setIncomingCall(null);
  };

  const handleRejectCall = async () => {
    try {
      await fetch('/api/call/signal', {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', from: username })
      });
    } catch (e) { }
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    setIsCalling(false);
    setActiveChannelName(null);
  };

  const handleSaveArtifact = async (url: string) => {
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        body: JSON.stringify({ artifact: url })
      });
      const newArtifact = { id: Math.random().toString(36).slice(2, 9), url, timestamp: Date.now(), type: 'video' };
      setArtifacts(prev => [newArtifact, ...prev]);
    } catch (e) { }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!username) {
    return (
      <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-neo-pink selection:text-white p-6 md:p-12">
        <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 border-b-4 border-black dark:border-white pb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black dark:bg-white flex items-center justify-center border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_theme(colors.neo-pink)]">
              <Zap className="text-neo-yellow dark:text-neo-pink w-6 h-6 fill-current" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Studio</h1>
          </div>
          <div className="flex items-center gap-6">
            <WalletManager onBalanceChange={setBalance} />
            <button onClick={() => logout()} className="font-black uppercase text-xs hover:text-red-500 transition-colors">Logout</button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="neo-box bg-white dark:bg-zinc-900 p-8 space-y-6">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Enter the Engine</h2>
            <p className="font-bold text-zinc-600 dark:text-zinc-400 uppercase text-xs tracking-widest leading-relaxed">
              Claim your unique link and start exchanging energy for tokens. Pure monetized time.
            </p>
            <form onSubmit={handleClaim} className="space-y-6 pt-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest block mb-2 text-zinc-400">Your Identity</label>
                <div className="flex items-center bg-zinc-50 dark:bg-black border-4 border-black dark:border-white p-4 focus-within:bg-neo-yellow/10 transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_var(--neo-pink)]">
                  <span className="text-black/30 dark:text-white/30 font-black text-sm pr-1">supertime.wtf/</span>
                  <input
                    type="text"
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="NAME"
                    className="flex-1 bg-transparent border-none outline-none text-black dark:text-white font-black text-sm uppercase placeholder:text-black/10 dark:placeholder:text-white/10"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!claimName || claimLoading}
                className="w-full neo-btn bg-neo-pink text-white py-5 text-xl"
              >
                {claimLoading ? 'CLAIMING...' : 'INITIALIZE STUDIO'}
              </button>
              {claimError && <p className="text-red-500 text-[10px] uppercase font-bold text-center">{claimError}</p>}
            </form>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-neo-blue border-4 border-black dark:border-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_var(--neo-pink)] text-white">
              <h3 className="text-2xl font-black uppercase mb-4">Earning Dashboard</h3>
              <p className="font-bold opacity-80 uppercase text-[10px] tracking-widest mb-8">Your balance and stats will appear here once you go live.</p>
              <div className="h-1 bg-white/20 w-full" />
            </div>
            <div className="bg-neo-yellow border-4 border-black dark:border-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_var(--neo-pink)]">
              <h3 className="text-2xl font-black uppercase mb-2">Energy Wallet</h3>
              <p className="font-black text-5xl mb-4 tabular-nums text-black">{balance ?? '0'} <span className="text-xl">TKN</span></p>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/60">
                <Sparkles className="w-4 h-4" />
                Ready to use
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-neo-pink selection:text-white">
      {/* ACTIVE CALL / ROOM OVERLAY */}
      {activeChannelName && (
        <div className="fixed inset-0 z-[500] bg-black">
          {isCalling ? (
            <div className="absolute top-8 left-8 z-[510] flex gap-4">
              <div className="bg-neo-yellow border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-black uppercase text-black/40 mb-1">Session Duration</p>
                <p className="text-2xl font-black tabular-nums">{formatTime(callDuration)}</p>
              </div>
              <div className="bg-neo-pink border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
                <p className="text-[10px] font-black uppercase text-white/40 mb-1">Energy Earned</p>
                <p className="text-2xl font-black tabular-nums">{tokensEarned.toFixed(2)} TKN</p>
              </div>
            </div>
          ) : (
            <div className="absolute top-8 left-8 z-[510] flex flex-col gap-2">
              <div className="bg-neo-green border-4 border-black dark:border-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_var(--neo-pink)] text-black">
                <p className="text-[10px] font-black uppercase mb-1">Studio Space Live</p>
                <p className="text-xl font-black uppercase italic tracking-tighter">Your room is active</p>
              </div>
              <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_var(--neo-pink)] flex items-center gap-3 text-black dark:text-white">
                <div className={`w-3 h-3 rounded-full ${roomType === 'video' ? 'bg-neo-pink' : 'bg-neo-blue'} animate-pulse`} />
                <span className="text-[10px] font-black uppercase">{roomType} Room • {isRoomFree ? 'Free Access' : 'Paid Access'}</span>
              </div>
            </div>
          )}
          <AgoraCall
            channelName={activeChannelName}
            type={isCalling ? callType! : roomType}
            onDisconnect={() => {
              if (isCalling) handleEndCall();
              else setIsLive(false);
            }}
            onSaveArtifact={handleSaveArtifact}
          />
        </div>
      )}

      {/* HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/90 backdrop-blur-md border-b-4 border-black dark:border-white py-4 transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_theme(colors.neo-pink)] transition-transform group-hover:rotate-12">
                <Zap className="text-neo-yellow dark:text-neo-pink w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">Studio</span>
            </a>
            <div className="hidden md:flex gap-6">
              <a href={`/${username}`} className="text-[10px] font-black uppercase tracking-widest text-black/60 dark:text-white/60 hover:text-neo-pink transition-colors">Public Profile</a>
              <button onClick={() => setShowSettings(true)} className="text-[10px] font-black uppercase tracking-widest text-black/60 dark:text-white/60 hover:text-neo-pink transition-colors">Settings</button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ThemeToggle className="relative" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-zinc-400">Status:</span>
              <div className={`flex items-center gap-2 px-3 py-1 border-2 border-black dark:border-white font-black uppercase text-[10px] ${isLive ? 'bg-neo-green text-black' : 'bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--neo-pink)]'}`}>
                {isLive ? 'Live' : 'Offline'}
              </div>
            </div>
            <button onClick={() => logout()} className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--neo-pink)] active:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid lg:grid-cols-12 gap-12">

          {/* LEFT COLUMN: CONTROL PANEL */}
          <div className="lg:col-span-4 space-y-8">
            <div className="neo-box bg-white dark:bg-zinc-900 p-8">
              <div className="relative w-32 h-32 bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_var(--neo-pink)] mx-auto mb-8 overflow-hidden">
                {pendingProfileImage ? (
                  <img src={pendingProfileImage} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} className="w-full h-full object-cover" />
                )}
              </div>
              <h2 className="text-3xl font-black uppercase text-center mb-2 tracking-tighter italic text-black dark:text-white">{username}</h2>
              <p className="text-center font-bold text-zinc-400 uppercase text-[10px] tracking-widest mb-8">Creator Studio Instance</p>

              <button
                onClick={async () => {
                  const next = !isLive;
                  setIsLive(next);
                  await fetch('/api/studio/update', { method: 'POST', body: JSON.stringify({ isLive: next }) });
                }}
                className={`w-full neo-btn py-5 text-xl font-black ${isLive ? 'bg-neo-pink text-white animate-pulse' : 'bg-neo-green text-black'}`}
              >
                {isLive ? 'FINISH SESSION' : 'GO LIVE NOW'}
              </button>
            </div>

            <div className="bg-neo-yellow border-4 border-black dark:border-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_var(--neo-pink)] text-black">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Session Log
                </h3>
                <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black dark:border-white">LIVE</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-2 border-black/10 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Tokens Earned</span>
                  <span className="font-black text-2xl tabular-nums">1.2k <span className="text-xs">TKN</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Total Minutes</span>
                  <span className="font-black text-2xl tabular-nums">142 <span className="text-xs">MIN</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: QUEUE & CONTENT */}
          <div className="lg:col-span-8 space-y-12">

            {/* INCOMING CALL BANNER (NEOBRUTALIST STYLE) */}
            <AnimatePresence>
              {incomingCall && !isCalling && (
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  className="bg-neo-blue border-8 border-black dark:border-white p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_var(--neo-pink)] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rotate-45 translate-x-16 translate-y-[-16px]" />
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 bg-white dark:bg-black border-4 border-black dark:border-white flex items-center justify-center text-3xl">👤</div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CEFF1A] mb-1">Incoming Signal</p>
                      <h3 className="text-4xl font-black uppercase italic tracking-tighter">{incomingCall.from || 'Guest'}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-white text-black text-[10px] font-black uppercase border-2 border-black">{incomingCall.type}</span>
                        <span className="text-xs font-bold uppercase opacity-60 italic">Connecting...</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 relative z-10 w-full md:w-auto">
                    <button onClick={handleRejectCall} className="flex-1 md:flex-none neo-btn bg-red-500 text-white px-8 py-3 font-black">REJECT</button>
                    <button onClick={() => handleAcceptCall(incomingCall.type)} className="flex-1 md:flex-none neo-btn bg-neo-green text-black px-12 py-3 font-black animate-bounce shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_white]">ANSWER</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid md:grid-cols-2 gap-8">
              {/* WAITLIST */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic text-black dark:text-white">Waitlist</h3>
                  <div className="h-1 flex-1 bg-black dark:bg-white" />
                  <span className="text-[10px] font-black bg-black dark:bg-white text-white dark:text-black px-2 py-0.5">{requests.length}</span>
                </div>
                {requests.length === 0 ? (
                  <div className="border-4 border-black dark:border-white border-dashed p-10 text-center">
                    <p className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-[0.2em]">Queue Empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req, i) => (
                      <div key={i} className="neo-box bg-white dark:bg-zinc-900 p-4 flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neo-yellow dark:bg-neo-yellow border-2 border-black dark:border-white text-sm font-black italic text-black">#{i + 1}</div>
                          <div>
                            <p className="font-black uppercase text-sm text-black dark:text-white">{req.from || 'Guest'}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(req.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <button className="w-8 h-8 border-2 border-black dark:border-white flex items-center justify-center hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SCHEDULE */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic text-black dark:text-white">Schedule</h3>
                  <div className="h-1 flex-1 bg-black dark:bg-white" />
                  <span className="text-[10px] font-black bg-black dark:bg-white text-white dark:text-black px-2 py-0.5">{bookings.length}</span>
                </div>
                {bookings.length === 0 ? (
                  <div className="border-4 border-black dark:border-white border-dashed p-10 text-center">
                    <p className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-[0.2em]">No bookings</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking, i) => (
                      <div key={i} className="neo-box bg-white dark:bg-zinc-900 p-4 group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#D652FF]">{booking.date} @ {booking.time}</span>
                          <div className="w-2 h-2 rounded-full bg-neo-pink animate-pulse" />
                        </div>
                        <p className="font-black uppercase text-lg italic tracking-tight mb-1 text-black dark:text-white">{booking.visitorEmail.split('@')[0]}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{booking.duration} Min {booking.type}</span>
                          <button onClick={() => window.open(`mailto:${booking.visitorEmail}`)} className="text-[10px] font-black uppercase underline decoration-2 decoration-neo-blue underline-offset-4 text-black dark:text-white">Notify Client</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ARTIFACTS GRID */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-black dark:text-white">Recorded Highlights</h3>
                <div className="h-2 flex-1 bg-black dark:bg-white" />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artifacts.map((art: any) => (
                  <div key={art.id} className="neo-box bg-white dark:bg-zinc-900 overflow-hidden group">
                    <div className="relative aspect-video bg-zinc-100 dark:bg-black border-b-2 border-black dark:border-white">
                      <video src={art.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <button onClick={() => window.open(art.url, '_blank')} className="neo-btn bg-white dark:bg-black text-black dark:text-white px-4 py-1 text-xs font-black">WATCH</button>
                      </div>
                    </div>
                    <div className="p-3 flex justify-between items-center text-black dark:text-white">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{new Date(art.timestamp).toLocaleDateString()}</span>
                      <button className="text-red-500 hover:scale-110 transition-transform">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {artifacts.length === 0 && (
                  <div className="col-span-full border-4 border-black dark:border-white border-dashed p-12 text-center text-zinc-400 dark:text-zinc-600 uppercase font-black tracking-widest text-xs">
                    Highlights will appear here after calls
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white dark:bg-zinc-900 border-8 border-black dark:border-white shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_var(--neo-pink)] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-10 pb-6 border-b-4 border-black dark:border-white text-black dark:text-white ">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter">Studio Config</h2>
                <button onClick={() => setShowSettings(false)} className="w-10 h-10 border-4 border-black dark:border-white flex items-center justify-center font-black hover:bg-neo-pink hover:text-white transition-all text-xl">✕</button>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Core Identity</h3>
                    <div className="flex items-center gap-6 p-4 bg-zinc-50 dark:bg-black border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_var(--neo-pink)]">
                      <div className="w-16 h-16 border-2 border-black dark:border-white bg-white dark:bg-black overflow-hidden shrink-0">
                        {pendingProfileImage ? <img src={pendingProfileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black italic text-black dark:text-white">?</div>}
                      </div>
                      <div className="space-y-2">
                        {isUploading ? <span className="text-[10px] font-black uppercase text-neo-pink animate-pulse">Uploading...</span> : (
                          <label className="neo-btn bg-black dark:bg-white text-white dark:text-black text-[10px] px-3 py-1 cursor-pointer">
                            CHANGE PHOTO
                            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                          </label>
                        )}
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Max file size 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Room Configuration (Twitter Spaces)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setRoomType('audio')}
                        className={`flex items-center justify-center gap-2 p-4 border-4 border-black dark:border-white font-black uppercase text-xs transition-all ${roomType === 'audio' ? 'bg-neo-blue text-white shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white dark:bg-black text-black dark:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_var(--neo-pink)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'}`}
                      >
                        <Mic className="w-4 h-4" /> AUDIO ROOM
                      </button>
                      <button
                        onClick={() => setRoomType('video')}
                        className={`flex items-center justify-center gap-2 p-4 border-4 border-black dark:border-white font-black uppercase text-xs transition-all ${roomType === 'video' ? 'bg-neo-pink text-white shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white dark:bg-black text-black dark:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_var(--neo-pink)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'}`}
                      >
                        <Video className="w-4 h-4" /> VIDEO ROOM
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-black border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_var(--neo-pink)] text-black dark:text-white">
                      <div>
                        <p className="text-[10px] font-black uppercase">Monetization</p>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{isRoomFree ? 'Everyone can join for free' : 'Joining requires payment'}</p>
                      </div>
                      <button
                        onClick={() => setIsRoomFree(!isRoomFree)}
                        className={`px-4 py-2 border-2 border-black font-black uppercase text-[10px] transition-colors ${isRoomFree ? 'bg-neo-green' : 'bg-neo-yellow'}`}
                      >
                        {isRoomFree ? 'FREE' : 'PAID'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Energy Matrix (Rates)</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center bg-white dark:bg-black border-4 border-black dark:border-white focus-within:bg-neo-yellow/10 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_var(--neo-pink)] group">
                        <div className="w-12 h-12 border-r-4 border-black dark:border-white bg-neo-pink flex items-center justify-center text-white shrink-0"><Video className="w-5 h-5" /></div>
                        <div className="flex-1 px-4 text-black dark:text-white">
                          <label className="text-[8px] font-black uppercase text-zinc-400 block pb-1">Video Call / MIN</label>
                          <input type="number" value={pendingVideoRate} onChange={(e) => setPendingVideoRate(Number(e.target.value))} className="w-full bg-transparent border-none outline-none font-black text-lg" />
                        </div>
                      </div>
                      <div className="flex items-center bg-white dark:bg-black border-4 border-black dark:border-white focus-within:bg-neo-yellow/10 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_var(--neo-pink)] group">
                        <div className="w-12 h-12 border-r-4 border-black dark:border-white bg-neo-blue flex items-center justify-center text-white shrink-0"><Mic className="w-5 h-5" /></div>
                        <div className="flex-1 px-4 text-black dark:text-white">
                          <label className="text-[8px] font-black uppercase text-zinc-400 block pb-1">Audio Only / MIN</label>
                          <input type="number" value={pendingAudioRate} onChange={(e) => setPendingAudioRate(Number(e.target.value))} className="w-full bg-transparent border-none outline-none font-black text-lg" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Social Matrix</h3>
                    <div className="grid gap-3">
                      {['instagram', 'x', 'youtube', 'website'].map((platform) => (
                        <div key={platform} className="bg-zinc-50 dark:bg-black border-4 border-black dark:border-white p-3 focus-within:bg-neo-yellow/10 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_var(--neo-pink)] flex items-center">
                          <Globe className="w-4 h-4 mr-3 text-zinc-300 dark:text-zinc-600" />
                          <input
                            type="text"
                            value={(pendingSocials as any)[platform]}
                            onChange={(e) => setPendingSocials({ ...pendingSocials, [platform]: e.target.value })}
                            className="bg-transparent border-none outline-none font-bold text-xs flex-1 uppercase tracking-tighter text-black dark:text-white"
                            placeholder={`${platform} URL`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Fixed Offerings</h3>
                      <button
                        onClick={() => setPendingTemplates([...pendingTemplates, { id: Math.random().toString(36).slice(2, 7), duration: 20, price: 150, description: 'Strategy Session', type: 'video' }])}
                        className="bg-black text-white text-[9px] font-black p-1 hover:bg-neo-pink transition-colors"
                      >
                        + ADD NEW
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {pendingTemplates.map((tpl, idx) => (
                        <div key={tpl.id} className="neo-box bg-white dark:bg-black p-4 relative group">
                          <button onClick={() => setPendingTemplates(pendingTemplates.filter(t => t.id !== tpl.id))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:scale-110"><Trash2 className="w-4 h-4" /></button>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-zinc-50 dark:bg-zinc-900 border-2 border-black dark:border-white p-2">
                              <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Duration (Min)</label>
                              <input type="number" value={tpl.duration} onChange={(e) => { const n = [...pendingTemplates]; n[idx].duration = Number(e.target.value); setPendingTemplates(n); }} className="w-full bg-transparent border-none outline-none font-black text-xs text-black dark:text-white" />
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-900 border-2 border-black dark:border-white p-2">
                              <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Price (TKN)</label>
                              <input type="number" value={tpl.price} onChange={(e) => { const n = [...pendingTemplates]; n[idx].price = Number(e.target.value); setPendingTemplates(n); }} className="w-full bg-transparent border-none outline-none font-black text-xs text-black dark:text-white" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <select value={tpl.type} onChange={(e) => { const n = [...pendingTemplates]; n[idx].type = e.target.value; setPendingTemplates(n); }} className="bg-black dark:bg-white text-white dark:text-black font-black uppercase text-[10px] px-2 py-1 outline-none">
                              <option value="video">Video</option>
                              <option value="audio">Audio</option>
                            </select>
                            <input type="text" value={tpl.description} onChange={(e) => { const n = [...pendingTemplates]; n[idx].description = e.target.value; setPendingTemplates(n); }} className="flex-1 bg-zinc-50 dark:bg-zinc-900 border-2 border-black dark:border-white p-2 text-[10px] font-bold outline-none uppercase text-black dark:text-white" placeholder="Description of session" />
                          </div>
                        </div>
                      ))}
                      {pendingTemplates.length === 0 && <p className="text-center text-[10px] font-black uppercase text-zinc-300 dark:text-zinc-600 py-10 border-4 border-black dark:border-white border-dashed">No Fixed Offerings Defined</p>}
                    </div>
                  </div>

                  <div className="pt-8 border-t-8 border-black dark:border-white flex gap-6">
                    <button onClick={() => setShowSettings(false)} className="flex-1 text-sm font-black uppercase tracking-widest hover:underline underline-offset-8 text-black dark:text-white">Cancel Changes</button>
                    <button onClick={saveSettings} className="flex-1 neo-btn bg-neo-green text-black py-5 text-xl">APPLY MATRIX</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}