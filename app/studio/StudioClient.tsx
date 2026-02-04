'use client';

import React, { useState, useEffect } from 'react';
import { AblyProvider, useCallSignaling } from '@/app/lib/ably';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ArrowRight,
  Users,
  Lock,
  Shield,
  Infinity as InfinityIcon,
  ExternalLink,
  ChevronRight,
  Eye,
  Camera,
  Play
} from 'lucide-react';
import dynamic from 'next/dynamic';
const SuperCall = dynamic(() => import('../components/SuperCall'), { ssr: false });
const BroadcastHost = dynamic(() => import('../components/Broadcast/BroadcastHost'), { ssr: false });
import { logout, checkAvailability, claimUsername } from '../actions';
import WalletManager from '../components/WalletManager';

export default function StudioClient({ username, session, initialSettings }: { username: string | null, session: any, initialSettings?: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSimulated = typeof window !== 'undefined' && window.location.search.includes('sim=true');

  // Use a mock username if in simulator mode
  const effectiveUsername = isSimulated ? (username || 'test-creator') : username;

  const [isLive, setIsLive] = useState(initialSettings?.isLive ?? false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

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

  // Economics
  const [balance, setBalance] = useState<number | null>(null);
  const [withdrawable, setWithdrawable] = useState<number>(0);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // SEPARATE STATES: Broadcast and Calls are independent
  const [isAcceptingCalls, setIsAcceptingCalls] = useState(initialSettings?.isAcceptingCalls ?? true);
  // isLive = broadcasting, isAcceptingCalls = taking 1:1 calls

  const handleToggleCalls = async () => {
    const next = !isAcceptingCalls;
    setIsAcceptingCalls(next);
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAcceptingCalls: next })
      });
    } catch (e) {
      console.error("Failed to update calls status", e);
    }
  };

  const fetchDetailedWallet = async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      setBalance(data.balance);
      setWithdrawable(data.withdrawable || 0);
    } catch (e) { }
  };

  useEffect(() => {
    fetchDetailedWallet();
    const interval = setInterval(fetchDetailedWallet, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleWithdraw = async () => {
    if (!upiId || withdrawAmount <= 0) {
      alert("Please enter a valid amount and UPI ID.");
      return;
    }
    if (withdrawAmount > withdrawable) {
      alert("Insufficient withdrawable balance.");
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw', amount: withdrawAmount, upiId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Withdrawal request sent! Funds deducted from balance.");
        setShowWithdraw(false);
        fetchDetailedWallet();
      } else {
        alert("Withdrawal failed: " + data.error);
      }
    } catch (e) {
      alert("Request failed.");
    } finally {
      setIsWithdrawing(false);
    }
  };

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
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/studio/stats');
        const data = await res.json();
        setStats(data);
      } catch (e) { } finally {
        setLoadingStats(false);
      }
    };
    if (effectiveUsername) fetchStats();
  }, [effectiveUsername]);

  useEffect(() => {
    // When creator goes live (broadcasting), join the public room
    if (!effectiveUsername || !isLive || isCalling) {
      if (!isLive) setActiveChannelName(null);
      return;
    }
    // Broadcasting = join public room
    console.log(`[Studio] Broadcasting live, joining room-${effectiveUsername}`);
    setActiveChannelName(`room-${effectiveUsername}`);
  }, [isLive, isCalling, effectiveUsername]);

  // Ably real-time signaling (injected from StudioWrapper)
  const ablySignaling = initialSettings?._ablySignaling;

  // Listen for incoming calls via Ably
  useEffect(() => {
    if (ablySignaling?.isConnected) {
      console.log('[Studio] Ably Signaling: Connected and Listening');
    } else {
      console.log('[Studio] Ably Signaling: Disconnected or state check fails', {
        exists: !!ablySignaling,
        connected: ablySignaling?.isConnected
      });
    }

    if (ablySignaling?.incomingCall && !isCalling) {
      console.log('[Studio] INCOMING CALL DETECTED via Ably:', ablySignaling.incomingCall);
      setIncomingCall(ablySignaling.incomingCall);
    }
  }, [ablySignaling?.incomingCall, ablySignaling?.isConnected, isCalling]);


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

  if (!effectiveUsername) {
    return (
      <main className="min-h-screen bg-white text-black font-sans selection:bg-neo-pink selection:text-white p-6 md:p-12">
        <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 border-b-4 border-black pb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_theme(colors.neo-pink)]">
              <Zap className="text-neo-yellow w-6 h-6 fill-current" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Studio</h1>
          </div>
          <div className="flex items-center gap-6">
            <WalletManager onBalanceChange={setBalance} />
            <button onClick={() => logout()} className="font-black uppercase text-xs hover:text-red-500 transition-colors">Logout</button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="neo-box bg-white p-8 space-y-6">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Enter the Engine</h2>
            <p className="font-bold text-zinc-600 uppercase text-xs tracking-widest leading-relaxed">
              Claim your unique link and start exchanging energy for tokens. Pure monetized time.
            </p>
            <form onSubmit={handleClaim} className="space-y-6 pt-4">
              <div className="w-full">
                <label className="text-[10px] font-black uppercase tracking-widest block mb-2 text-zinc-400">Your Identity</label>
                <div className="flex flex-col sm:flex-row items-stretch bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] focus-within:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
                  <div className="flex-1 flex items-center px-4 py-4 border-b-4 sm:border-b-0 sm:border-r-4 border-black bg-zinc-50 min-w-0">
                    <span className="text-black/30 font-black text-xs md:text-sm pr-1 shrink-0">supertime.wtf/</span>
                    <input
                      type="text"
                      value={claimName}
                      onChange={(e) => setClaimName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="NAME"
                      className="flex-1 bg-transparent border-none outline-none text-black font-black text-sm md:text-base uppercase placeholder:text-black/10 min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!claimName || claimLoading}
                    className="bg-neo-pink text-white font-black px-6 py-4 sm:py-0 hover:bg-neo-pink/90 transition-colors disabled:opacity-50 uppercase text-sm md:text-base flex items-center justify-center shrink-0"
                  >
                    {claimLoading ? '...' : 'CLAIM'}
                  </button>
                </div>
              </div>
              {claimError && <p className="text-red-500 text-[10px] uppercase font-bold text-center">{claimError}</p>}
            </form>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-neo-yellow border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
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
    <div className="min-h-screen bg-white text-black font-sans selection:bg-neo-pink selection:text-white">
      {/* ACTIVE SESSION OVERLAY */}
      {/* Broadcasting → BroadcastHost */}
      {isLive && activeChannelName && !isCalling && (
        <BroadcastHost
          channelName={activeChannelName}
          uid={session?.user?.id || 'studio-host'}
          onEnd={() => {
            setIsLive(false);
            setActiveChannelName(null);
          }}
          onCallRequest={(req: any) => {
            setIncomingCall(req);
          }}
        />
      )}

      {/* Active 1:1 Call (any mode) → SuperCall */}
      {isCalling && activeChannelName && (
        <div className="fixed inset-0 z-[500] bg-black">
          {/* Status Bar for 1:1 calls */}
          <div className="absolute top-4 left-4 right-4 z-[510] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-black uppercase tracking-wider">
                1:1 Session
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-neo-yellow px-3 py-1 border-2 border-black">
                <span className="text-sm font-black tabular-nums">{formatTime(callDuration)}</span>
              </div>
              <div className="bg-neo-green px-3 py-1 border-2 border-black">
                <span className="text-sm font-black tabular-nums">+{tokensEarned.toFixed(0)} TKN</span>
              </div>
            </div>
          </div>
          <SuperCall
            key={activeChannelName}
            channelName={activeChannelName}
            uid={session?.user?.id || 'studio-host'}
            type={callType || roomType}
            onDisconnect={() => {
              handleEndCall();
              setActiveChannelName(null);
            }}
            onSaveArtifact={handleSaveArtifact}
          />
        </div>
      )}

      {/* HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b-4 border-black py-4 transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_theme(colors.neo-pink)] transition-transform group-hover:rotate-12">
                <Zap className="text-neo-yellow w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-black uppercase tracking-tighter text-black">Studio</span>
            </a>
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => window.open(`/${username}?sim=true`, '_blank')}
                className="bg-neo-yellow border-2 border-black px-3 py-1 text-[8px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Launch Simulator
              </button>
              <a href={`/${username}`} className="text-[10px] font-black uppercase tracking-widest text-black/60 hover:text-neo-pink transition-colors">Public Profile</a>
              <button onClick={() => setShowSettings(true)} className="text-[10px] font-black uppercase tracking-widest text-black/60 hover:text-neo-pink transition-colors">Settings</button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {!isCalling && <WalletManager onBalanceChange={setBalance} />}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-zinc-400">Status:</span>
              <div className={`flex items-center gap-2 px-3 py-1 border-2 border-black font-black uppercase text-[10px] ${isLive ? 'bg-neo-green text-black' : 'bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                {isLive ? 'Live' : 'Offline'}
              </div>
            </div>
            <button onClick={() => logout()} className="w-10 h-10 bg-black text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">

        {/* TWO INDEPENDENT CONTROLS: Broadcast & Calls */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">

          {/* BROADCAST PANEL */}
          <div className={`border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors ${isLive ? 'bg-neo-blue' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📺</span>
              <h3 className={`text-xl font-black uppercase ${isLive ? 'text-white' : 'text-black'}`}>Broadcast</h3>
            </div>
            <p className={`text-xs font-bold uppercase mb-4 ${isLive ? 'text-white/70' : 'text-black/50'}`}>
              {isLive ? `Streaming on room-${effectiveUsername}` : 'Stream to your fans'}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isLive && <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />}
                <span className={`text-sm font-black uppercase ${isLive ? 'text-white' : 'text-black/60'}`}>
                  {isLive ? 'LIVE' : 'Offline'}
                </span>
              </div>
              <button
                onClick={async () => {
                  const next = !isLive;
                  setIsLive(next);
                  await fetch('/api/studio/update', { method: 'POST', body: JSON.stringify({ isLive: next }) });
                }}
                className={`px-6 py-3 border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all ${isLive ? 'bg-red-500 text-white' : 'bg-neo-green text-black'}`}
              >
                {isLive ? 'END' : 'GO LIVE'}
              </button>
            </div>
          </div>

          {/* CALLS PANEL */}
          <div className={`border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors ${isAcceptingCalls ? 'bg-neo-pink' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📞</span>
              <h3 className={`text-xl font-black uppercase ${isAcceptingCalls ? 'text-white' : 'text-black'}`}>1:1 Calls</h3>
            </div>
            <p className={`text-xs font-bold uppercase mb-4 ${isAcceptingCalls ? 'text-white/70' : 'text-black/50'}`}>
              {isAcceptingCalls ? 'Fans can request calls' : 'Not taking calls'}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAcceptingCalls && <div className="w-3 h-3 rounded-full bg-white animate-pulse" />}
                <span className={`text-sm font-black uppercase ${isAcceptingCalls ? 'text-white' : 'text-black/60'}`}>
                  {isAcceptingCalls ? 'READY' : 'Off'}
                </span>
              </div>
              <button
                onClick={handleToggleCalls}
                className={`px-6 py-3 border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all ${isAcceptingCalls ? 'bg-red-500 text-white' : 'bg-neo-green text-black'}`}
              >
                {isAcceptingCalls ? 'STOP' : 'ACCEPT'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">

          {/* LEFT COLUMN: CONTROL PANEL */}
          <div className="lg:col-span-4 space-y-8">
            <div className="neo-box bg-white p-8">
              <div className="relative w-32 h-32 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mx-auto mb-8 overflow-hidden">
                {pendingProfileImage ? (
                  <img src={pendingProfileImage} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} className="w-full h-full object-cover" />
                )}
              </div>
              <h2 className="text-3xl font-black uppercase text-center mb-4 tracking-tighter italic text-black">{username}</h2>
              <a
                href={`/${username}`}
                target="_blank"
                className="block w-full text-center bg-black text-white py-3 font-black uppercase text-xs border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-pink transition-colors"
              >
                View Public Profile →
              </a>
            </div>

            <div className="bg-neo-yellow border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
              <h3 className="text-2xl font-black uppercase mb-2">Energy Wallet</h3>
              <p className="font-black text-5xl mb-4 tabular-nums">{balance ?? '0'} <span className="text-xl">TKN</span></p>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/60">
                <Sparkles className="w-4 h-4" />
                Ready to use
              </div>
            </div>


            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Session Log
                </h3>
                <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black">LIVE</span>
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

            {withdrawable > 0 && (
              <div className="bg-neo-pink border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
                <h3 className="text-lg font-black uppercase mb-1 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Earnings
                </h3>
                <p className="font-black text-3xl mb-4 tabular-nums">₹{withdrawable}</p>
                <button
                  onClick={() => router.push('/wallet')}
                  className="w-full bg-white text-black py-3 font-black uppercase text-[10px] hover:bg-neo-yellow transition-all border-2 border-black"
                >
                  SETTLE IN VAULT
                </button>
              </div>
            )}
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
                  className="bg-neo-blue border-8 border-black p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rotate-45 translate-x-16 translate-y-[-16px]" />
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 bg-white border-4 border-black flex items-center justify-center text-3xl">👤</div>
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
                    <button onClick={() => handleAcceptCall(incomingCall.type)} className="flex-1 md:flex-none neo-btn bg-neo-green text-black px-12 py-3 font-black animate-bounce shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">ANSWER</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Call requests and stats - shown when accepting calls */}
            {false ? (
              <div className="space-y-12">
                {/* REMOVED: Solitude content */}
                <div className="neo-box bg-black p-8 border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-white">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter">Solitude Lab</h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 text-[10px] font-black uppercase border-2 border-black">
                      <Shield className="w-3 h-3 text-neo-green" /> Offline
                    </div>
                  </div>

                  <div className="relative aspect-video bg-zinc-900 border-4 border-white/10 overflow-hidden mb-8 group">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                      <Zap className="w-32 h-32" />
                    </div>
                    {/* Simulated Stage Feed */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Preview Active</p>
                      <h4 className="text-2xl font-black uppercase tracking-tighter">System Baseline</h4>
                    </div>

                    <div className="absolute top-6 left-6 flex gap-2">
                      <div className="bg-neo-pink text-[8px] font-black uppercase px-2 py-0.5 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">DEV_ENV</div>
                      <div className="bg-white text-black text-[8px] font-black uppercase px-2 py-0.5 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">4K_READY</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-800 border-4 border-black hover:bg-neo-pink hover:text-white transition-all group">
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Snapshot</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-800 border-4 border-black hover:bg-neo-blue hover:text-white transition-all group">
                      <Play className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Record</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-800 border-4 border-black hover:bg-neo-green hover:text-black transition-all group">
                      <Users className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Training</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-800 border-4 border-black hover:bg-neo-yellow hover:text-black transition-all group">
                      <Plus className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add App</span>
                    </button>
                  </div>
                </div>

                {/* DEVELOPER ECOSYSTEM TEASER */}
                <div className="neo-box bg-neo-yellow/5 border-4 border-black border-dashed p-10 text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neo-yellow/10 rounded-full translate-x-8 translate-y-[-8px] blur-3xl" />
                  <InfinityIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4 group-hover:rotate-180 transition-transform duration-700" />
                  <h3 className="text-xl font-black uppercase italic mb-2 text-black">Extensible Stage</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                    Build custom apps and plug them directly into your Studio. Coming soon to Supertime SDK.
                  </p>
                </div>
              </div>
            ) : false ? (
              <div className="space-y-12">
                {/* REMOVED: Theatre content */}
                <div className="neo-box bg-neo-pink p-8 border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-white">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-neo-green rounded-full animate-ping" />
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter">Live Stage</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1 bg-black/20 text-[10px] font-black uppercase border-2 border-white/20">
                        <Users className="w-3 h-3" /> 14 Admirers
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-neo-yellow text-black text-[10px] font-black uppercase border-2 border-black">
                        TICKET: 20 TKN
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="relative aspect-video bg-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden">
                        {/* Live Stream Preview */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Globe className="w-24 h-24 text-white/5 animate-spin-slow" />
                        </div>
                        <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 font-black uppercase text-[10px] tracking-widest">LIVE BROADCAST</div>
                      </div>

                      <div className="flex gap-4">
                        <button className="flex-1 neo-btn bg-white text-black py-4 font-black uppercase flex items-center justify-center gap-2">
                          <Mic className="w-5 h-5" /> Mic On
                        </button>
                        <button className="flex-1 neo-btn bg-black text-white py-4 font-black uppercase flex items-center justify-center gap-2 border-white">
                          <Video className="w-5 h-5" /> Cam Off
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-black/20 border-4 border-black p-4 h-[300px] flex flex-col">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Audience Chat</h4>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                          <p className="text-[10px] font-bold text-white/40 italic">Waiting for connection...</p>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <input type="text" placeholder="Say something..." className="flex-1 bg-black/40 border-2 border-black p-2 text-[10px] font-bold outline-none" />
                          <button className="bg-white text-black px-3 font-black">SEND</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* THEATRE CONTROLS */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="neo-box bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Entry Fee</h4>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black">20</span>
                      <span className="text-xs font-bold mb-1">TKN</span>
                    </div>
                  </div>
                  <div className="neo-box bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Revenue Share</h4>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black">₹4.2k</span>
                      <span className="text-xs font-bold mb-1 italic">TONIGHT</span>
                    </div>
                  </div>
                  <button className="neo-box bg-neo-green p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black flex flex-col items-center justify-center hover:bg-neo-yellow transition-all">
                    <Globe className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Share Stage</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {/* WAITLIST */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-black">Waitlist</h3>
                    <div className="h-1 flex-1 bg-black" />
                    <span className="text-[10px] font-black bg-black text-white px-2 py-0.5">{requests.length}</span>
                  </div>
                  {requests.length === 0 ? (
                    <div className="border-4 border-black border-dashed p-10 text-center text-black">
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Queue Empty</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((req, i) => (
                        <div key={i} className="neo-box bg-white p-4 flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neo-yellow border-2 border-black text-sm font-black italic text-black flex items-center justify-center">#{i + 1}</div>
                            <div>
                              <p className="font-black uppercase text-sm text-black">{req.from || 'Guest'}</p>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(req.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <button className="w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all text-black">
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
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-black">Schedule</h3>
                    <div className="h-1 flex-1 bg-black" />
                    <span className="text-[10px] font-black bg-black text-white px-2 py-0.5">{bookings.length}</span>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="border-4 border-black border-dashed p-10 text-center text-black">
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">No bookings</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map((booking, i) => (
                        <div key={i} className="neo-box bg-white p-4 group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#D652FF]">{booking.date} @ {booking.time}</span>
                            <div className="w-2 h-2 rounded-full bg-neo-pink animate-pulse" />
                          </div>
                          <p className="font-black uppercase text-lg italic tracking-tight mb-1 text-black">{booking.visitorEmail.split('@')[0]}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{booking.duration} Min {booking.type}</span>
                            <button onClick={() => window.open(`mailto:${booking.visitorEmail}`)} className="text-[10px] font-black uppercase underline decoration-2 decoration-neo-blue underline-offset-4 text-black">Notify Client</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ARTIFACTS GRID */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-black">Recorded Highlights</h3>
                <div className="h-2 flex-1 bg-black" />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artifacts.map((art: any) => (
                  <div key={art.id} className="neo-box bg-white overflow-hidden group">
                    <div className="relative aspect-video bg-zinc-100 border-b-2 border-black">
                      <video src={art.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <button onClick={() => window.open(art.url, '_blank')} className="neo-btn bg-white text-black px-4 py-1 text-xs font-black">WATCH</button>
                      </div>
                    </div>
                    <div className="p-3 flex justify-between items-center text-black">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{new Date(art.timestamp).toLocaleDateString()}</span>
                      <button className="text-red-500 hover:scale-110 transition-transform">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {artifacts.length === 0 && (
                  <div className="col-span-full border-4 border-black border-dashed p-12 text-center text-zinc-400 uppercase font-black tracking-widest text-xs">
                    Highlights will appear here after calls
                  </div>
                )}
              </div>
            </div>

            {/* PERFORMANCE ANALYTICS */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-black">Performance Analytics</h3>
                <div className="h-2 flex-1 bg-black" />
              </div>

              {!loadingStats && stats && (
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="neo-box bg-white p-6">
                    <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Total Profile Views</p>
                    <p className="text-4xl font-black italic">{stats.total.view || 0}</p>
                  </div>
                  <div className="neo-box bg-white p-6">
                    <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Total Calls</p>
                    <p className="text-4xl font-black italic">{stats.total.call_start || 0}</p>
                  </div>
                  <div className="neo-box bg-white p-6">
                    <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Total Earnings</p>
                    <p className="text-4xl font-black italic">{stats.total.earnings_amount || 0} <span className="text-xs italic">TKN</span></p>
                  </div>

                  <div className="md:col-span-3 neo-box bg-white p-8">
                    <h4 className="text-xl font-black uppercase mb-8">Earning & Engagement History (7 Days)</h4>
                    <div className="flex items-end justify-between h-48 gap-2">
                      {stats.history.map((day: any, i: number) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                          <div className="w-full bg-zinc-100 relative h-full flex flex-col justify-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.min(100, (day.views / (Math.max(...stats.history.map((d: any) => d.views)) || 1)) * 100)}%` }}
                              className="bg-neo-blue/20 w-full"
                            />
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.min(100, (day.earnings / (Math.max(...stats.history.map((d: any) => d.earnings)) || 1)) * 100)}%` }}
                              className="bg-neo-green w-full absolute bottom-0 left-0"
                            />
                          </div>
                          <span className="text-[8px] font-black uppercase text-zinc-400 rotate-45 mt-4">{day.date.split('-').slice(1).join('/')}</span>

                          {/* Tooltip */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white p-2 text-[8px] font-black uppercase z-10 pointer-events-none whitespace-nowrap">
                            Views: {day.views} | Earned: {day.earnings} TKN
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-12 flex gap-6 text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-neo-blue/20" /> Profile Views</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-neo-green" /> TKN Earnings</div>
                    </div>
                  </div>
                </div>
              )}
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
              className="bg-white border-8 border-black shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-10 pb-6 border-b-4 border-black text-black">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter">Studio Config</h2>
                <button onClick={() => setShowSettings(false)} className="w-10 h-10 border-4 border-black flex items-center justify-center font-black hover:bg-neo-pink hover:text-white transition-all text-xl">✕</button>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Core Identity</h3>
                    <div className="flex items-center gap-6 p-4 bg-zinc-50 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                      <div className="w-16 h-16 border-2 border-black bg-white overflow-hidden shrink-0">
                        {pendingProfileImage ? <img src={pendingProfileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black italic text-black">?</div>}
                      </div>
                      <div className="space-y-2">
                        {isUploading ? <span className="text-[10px] font-black uppercase text-neo-pink animate-pulse">Uploading...</span> : (
                          <label className="neo-btn bg-black text-white text-[10px] px-3 py-1 cursor-pointer">
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
                        className={`flex items-center justify-center gap-2 p-4 border-4 border-black font-black uppercase text-xs transition-all ${roomType === 'audio' ? 'bg-neo-blue text-white shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'}`}
                      >
                        <Mic className="w-4 h-4" /> AUDIO ROOM
                      </button>
                      <button
                        onClick={() => setRoomType('video')}
                        className={`flex items-center justify-center gap-2 p-4 border-4 border-black font-black uppercase text-xs transition-all ${roomType === 'video' ? 'bg-neo-pink text-white shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'}`}
                      >
                        <Video className="w-4 h-4" /> VIDEO ROOM
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
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
                      <div className="flex items-center bg-white border-4 border-black focus-within:bg-neo-yellow/10 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group">
                        <div className="w-12 h-12 border-r-4 border-black bg-neo-pink flex items-center justify-center text-white shrink-0"><Video className="w-5 h-5" /></div>
                        <div className="flex-1 px-4 text-black">
                          <label className="text-[8px] font-black uppercase text-zinc-400 block pb-1">Video Call / MIN</label>
                          <input type="number" value={pendingVideoRate} onChange={(e) => setPendingVideoRate(Number(e.target.value))} className="w-full bg-transparent border-none outline-none font-black text-lg" />
                        </div>
                      </div>
                      <div className="flex items-center bg-white border-4 border-black focus-within:bg-neo-yellow/10 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group">
                        <div className="w-12 h-12 border-r-4 border-black bg-neo-blue flex items-center justify-center text-white shrink-0"><Mic className="w-5 h-5" /></div>
                        <div className="flex-1 px-4 text-black">
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
                        <div key={platform} className="bg-zinc-50 border-4 border-black p-3 focus-within:bg-neo-yellow/10 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center">
                          <Globe className="w-4 h-4 mr-3 text-zinc-300" />
                          <input
                            type="text"
                            value={(pendingSocials as any)[platform]}
                            onChange={(e) => setPendingSocials({ ...pendingSocials, [platform]: e.target.value })}
                            className="bg-transparent border-none outline-none font-bold text-xs flex-1 uppercase tracking-tighter text-black"
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
                        <div key={tpl.id} className="neo-box bg-white p-4 relative group">
                          <button onClick={() => setPendingTemplates(pendingTemplates.filter(t => t.id !== tpl.id))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:scale-110"><Trash2 className="w-4 h-4" /></button>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-zinc-50 border-2 border-black p-2">
                              <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Duration (Min)</label>
                              <input type="number" value={tpl.duration} onChange={(e) => { const n = [...pendingTemplates]; n[idx].duration = Number(e.target.value); setPendingTemplates(n); }} className="w-full bg-transparent border-none outline-none font-black text-xs text-black" />
                            </div>
                            <div className="bg-zinc-50 border-2 border-black p-2">
                              <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Price (TKN)</label>
                              <input type="number" value={tpl.price} onChange={(e) => { const n = [...pendingTemplates]; n[idx].price = Number(e.target.value); setPendingTemplates(n); }} className="w-full bg-transparent border-none outline-none font-black text-xs text-black" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <select value={tpl.type} onChange={(e) => { const n = [...pendingTemplates]; n[idx].type = e.target.value; setPendingTemplates(n); }} className="bg-black text-white font-black uppercase text-[10px] px-2 py-1 outline-none">
                              <option value="video">Video</option>
                              <option value="audio">Audio</option>
                            </select>
                            <input type="text" value={tpl.description} onChange={(e) => { const n = [...pendingTemplates]; n[idx].description = e.target.value; setPendingTemplates(n); }} className="flex-1 bg-zinc-50 border-2 border-black p-2 text-[10px] font-bold outline-none uppercase text-black" placeholder="Description of session" />
                          </div>
                        </div>
                      ))}
                      {pendingTemplates.length === 0 && <p className="text-center text-[10px] font-black uppercase text-zinc-300 py-10 border-4 border-black border-dashed">No Fixed Offerings Defined</p>}
                    </div>
                  </div>

                  <div className="pt-8 border-t-8 border-black flex gap-6">
                    <button onClick={() => setShowSettings(false)} className="flex-1 text-sm font-black uppercase tracking-widest hover:underline underline-offset-8 text-black">Cancel Changes</button>
                    <button onClick={saveSettings} className="flex-1 neo-btn bg-neo-green text-black py-5 text-xl">APPLY MATRIX</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}