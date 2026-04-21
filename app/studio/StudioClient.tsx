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
  Play,
  Menu,
  X
} from 'lucide-react';
import dynamic from 'next/dynamic';
const SuperCall = dynamic(() => import('../components/SuperCall'), { ssr: false });
const BroadcastHost = dynamic(() => import('../components/Broadcast/BroadcastHost'), { ssr: false });
import { checkAvailability, claimUsername } from '../actions';
import { useClerk } from "@clerk/nextjs";
import WalletManager from '../components/WalletManager';

export default function StudioClient({ username, session, initialSettings }: { username: string | null, session: any, initialSettings?: any }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const isSimulated = typeof window !== 'undefined' && window.location.search.includes('sim=true');

  // Use a mock username if in simulator mode
  const effectiveUsername = isSimulated ? (username || 'test-creator') : username;

  // Ably real-time signaling (injected from StudioWrapper)
  const ablySignaling = initialSettings?._ablySignaling;

  useEffect(() => {
    console.log('[Studio] Component Mounted:', {
      username,
      effectiveUsername,
      hasSession: !!session,
      isSimulated
    });
  }, []);

  const [isLive, setIsLive] = useState(initialSettings?.isLive ?? false);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Settings

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
  const [upiId, setUpiId] = useState(initialSettings?.upiId || '');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // SEPARATE STATES: Broadcast and Calls are independent
  const [isAcceptingCalls, setIsAcceptingCalls] = useState(initialSettings?.isAcceptingCalls ?? true);
  // isLive = broadcasting, isAcceptingCalls = taking 1:1 calls
  const [showDashboard, setShowDashboard] = useState(false);

  // Reactive sync with unified signaling
  useEffect(() => {
    if (ablySignaling?.activeCall) {
      console.log('[StudioClient] 📞 Active call detected via signaling:', ablySignaling.activeCall);
      setIsCalling(true);
      setCallType(ablySignaling.activeCall.type);
      setActiveChannelName(ablySignaling.activeCall.channelName);
    } else if (isCalling && !ablySignaling?.activeCall) {
      console.log('[StudioClient] 👋 Call ended via signaling. Resetting session.');
      setIsCalling(false);
      setActiveChannelName(null);
      setCallDuration(0);
      setTokensEarned(0);
    }
  }, [ablySignaling?.activeCall, isCalling]);

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
      // Save UPI ID for future use
      fetch('/api/studio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upiId })
      });

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
    // This effect manages the PUBLIC BROADCAST channel.
    // IF we are in a 1:1 call (isCalling), we stay hands-off.
    if (isCalling) return;

    if (!effectiveUsername || !isLive) {
      // Only clear if we were using a broadcast channel
      if (activeChannelName?.startsWith('room-')) {
        console.log('[Studio] Not live, clearing broadcast channel');
        setActiveChannelName(null);
      }
      return;
    }

    // Join broadcast room
    const broadcastChannel = `room-${effectiveUsername}`;
    if (activeChannelName !== broadcastChannel) {
      console.log(`[Studio] Broadcasting live, joining ${broadcastChannel}`);
      setActiveChannelName(broadcastChannel);
    }
  }, [isLive, isCalling, effectiveUsername, activeChannelName]);

  // Economics


  useEffect(() => {
    if (!isCalling || !isPeerConnected) return;
    const interval = setInterval(() => {
      setCallDuration(prev => {
        const next = prev + 1;
        // Estimate tokens earned (approximate display)
        const rate = callType === 'video' ? pendingVideoRate : pendingAudioRate;
        if (next % 60 === 0) setTokensEarned(e => e + rate);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCalling, isPeerConnected, callType, pendingVideoRate, pendingAudioRate]);

  // Call end handler

  const handleEndCall = () => {
    console.log('[Studio] 👋 Ending 1:1 Call Session');
    setIsCalling(false);
    setActiveChannelName(null);
    setIsPeerConnected(false);
    setCallDuration(0);
    setTokensEarned(0);
    ablySignaling?.endActiveCall();
  };

  const handleSaveArtifact = async (url: string) => {
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifact: url })
      });
      const newArtifact = { id: Math.random().toString(36).slice(2, 9), url, timestamp: Date.now(), type: 'video' };
      setArtifacts(prev => [newArtifact, ...prev]);
    } catch (e) { }
  };

  const handleDeleteArtifact = async (artifactId: string) => {
    try {
      const updatedArtifacts = artifacts.filter(a => a.id !== artifactId);
      setArtifacts(updatedArtifacts);

      await fetch('/api/studio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifacts: updatedArtifacts })
      });
    } catch (e) {
      console.error("Failed to delete artifact", e);
    }
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
            <button onClick={() => signOut(() => { window.location.href = "/"; })} className="font-black uppercase text-xs hover:text-red-500 transition-colors">Logout</button>
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
      {isLive && activeChannelName && !isCalling && (
        <BroadcastHost
          channelName={activeChannelName}
          uid={session?.user?.id || 'studio-host'}
          username={effectiveUsername!}
          onEnd={() => {
            setIsLive(false);
            setActiveChannelName(null);
          }}
        />
      )}

      {/* Active 1:1 Call → SuperCall (Premium HUD) */}
      {isCalling && activeChannelName && (
        <div className="fixed inset-0 z-[500] bg-zinc-950">
          {/* Status Bar for 1:1 calls - Standardized Premium Style */}
          <div className="absolute top-6 left-6 right-6 z-[510] flex items-center justify-start">
            <div className="flex items-center gap-2">
              <div className="bg-neo-green/10 border border-neo-green/20 px-4 py-2 rounded-xl">
                <span className="text-neo-green text-sm font-black tabular-nums">+{tokensEarned.toFixed(0)} TKN</span>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl">
                <span className="text-white text-sm font-black tabular-nums">{formatTime(callDuration)}</span>
              </div>
            </div>
          </div>
          <SuperCall
            key={activeChannelName}
            channelName={activeChannelName}
            uid={`studio-${session?.user?.id || 'host'}`}
            type={callType || roomType}
            onDisconnect={() => {
              handleEndCall();
              setActiveChannelName(null);
            }}
            onSaveArtifact={handleSaveArtifact}
            onPeerJoined={() => setIsPeerConnected(true)}
            onPeerLeft={() => setIsPeerConnected(false)}
          />
        </div>
      )}

      {/* The IncomingCallRing is now handled globally in StudioWrapper */}

      {/* HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 py-4 transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-white/5 flex items-center justify-center border border-white/10 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform group-hover:rotate-12">
                <Zap className="text-neo-yellow w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-extrabold uppercase tracking-tighter text-white">Studio</span>
              {isLive && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 rounded-full border border-red-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_theme(colors.red.500)]" />
                  <span className="text-[8px] font-extrabold text-red-500 uppercase tracking-widest">Live</span>
                </div>
              )}
            </a>

            <div className="hidden md:flex items-center gap-6">
              <a href={`/${username}`} className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-neo-pink transition-colors">Public Profile</a>
              <button
                onClick={() => {
                  const el = document.getElementById('highlights-vault');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-neo-pink transition-colors"
              >
                My Recordings
              </button>
              <button onClick={() => router.push('/studio/settings')} className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-neo-pink transition-colors">Settings</button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {!isCalling && <WalletManager onBalanceChange={setBalance} />}

            {/* Desktop Logout - now hidden on small screens */}
            <button
              onClick={() => signOut(() => { window.location.href = "/"; })}
              className="hidden md:flex w-10 h-10 bg-white/5 text-white border border-white/10 rounded-xl items-center justify-center hover:bg-white/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-xl"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-over Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[10000] bg-zinc-950 flex flex-col p-8 md:hidden"
          >
            {/* Background Accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-neo-pink/10 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-neo-blue/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 flex justify-between items-center mb-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10 rounded-xl">
                  <Zap className="text-neo-yellow w-6 h-6 fill-current" />
                </div>
                <span className="text-2xl font-extrabold uppercase tracking-tighter text-white">Menu</span>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-xl transition-all"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="relative z-10 flex flex-col gap-6 flex-1">
              <a
                href={`/${username}`}
                onClick={() => setShowMobileMenu(false)}
                className="text-4xl font-extrabold uppercase tracking-tighter text-white hover:text-neo-pink border-b border-white/10 pb-6 transition-colors"
              >
                Profile
              </a>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  router.push('/dashboard?tab=tools');
                }}
                className="text-4xl font-extrabold uppercase tracking-tighter text-white hover:text-neo-blue text-left border-b border-white/10 pb-6 transition-colors"
              >
                Tools
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  router.push('/wallet');
                }}
                className="text-4xl font-extrabold uppercase tracking-tighter text-neo-green hover:text-neo-yellow text-left border-b border-white/10 pb-6 transition-colors"
              >
                Vault
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  router.push('/studio/settings');
                }}
                className="text-4xl font-extrabold uppercase tracking-tighter text-white hover:text-neo-pink text-left border-b border-white/10 pb-6 transition-colors"
              >
                Settings
              </button>
            </div>

            <div className="relative z-10 pt-8">
              <button
                onClick={() => signOut(() => { window.location.href = "/"; })}
                className="w-full bg-red-500 text-white py-6 rounded-3xl font-extrabold uppercase text-xl tracking-tight flex items-center justify-center gap-4 shadow-2xl transition-all"
              >
                <LogOut className="w-8 h-8" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 mt-12">
          {/* QUEUE & SCHEDULE - Keep this prominent as it is active work */}
          <div className="lg:col-span-12">
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
          </div>
        </div>
      </main>

      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t-4 border-black p-4 flex justify-between items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => {
              const next = !isLive;
              setIsLive(next);
              fetch('/api/studio/update', { method: 'POST', body: JSON.stringify({ isLive: next }) });
            }}
            className={`flex-1 md:flex-none px-6 py-3 border-4 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all ${isLive ? 'bg-red-500 text-white' : 'bg-neo-green text-black'}`}
          >
            {isLive ? 'End Stream' : 'Go Live'}
          </button>
          <button
            onClick={handleToggleCalls}
            className={`flex-1 md:flex-none px-6 py-3 border-4 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all ${isAcceptingCalls ? 'bg-neo-pink text-white' : 'bg-zinc-100 text-black'}`}
          >
            {isAcceptingCalls ? 'Calls Ready' : 'Calls Off'}
          </button>
        </div>

        <button
          onClick={() => setShowDashboard(true)}
          className="bg-neo-yellow text-black px-6 py-3 border-4 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" /> Management
        </button>
      </div>

      {/* REFACTORED: BOTTOM DASHBOARD MODAL */}
      <AnimatePresence>
        {
          showDashboard && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[1000] bg-white border-t-8 border-black h-[85vh] flex flex-col overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.3)]"
            >
              <div className="flex justify-between items-center p-6 border-b-4 border-black bg-zinc-50">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-6 h-6" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Management Vault</h3>
                </div>
                <button
                  onClick={() => setShowDashboard(false)}
                  className="w-10 h-10 bg-black text-white border-2 border-black flex items-center justify-center font-black"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-12 pb-32">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-neo-yellow border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
                    <h3 className="text-xl font-black uppercase mb-1">Energy Wallet</h3>
                    <p className="font-black text-4xl mb-4 tabular-nums">{balance ?? '0'} <span className="text-lg">TKN</span></p>
                    <WalletManager onBalanceChange={setBalance} />
                  </div>

                  <div className="bg-neo-pink border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
                    <h3 className="text-xl font-black uppercase mb-1">Earnings</h3>
                    <p className="font-black text-4xl mb-4 tabular-nums">₹{withdrawable}</p>
                    <button
                      onClick={() => router.push('/wallet')}
                      className="w-full bg-white text-black py-2 font-black uppercase text-[10px] border-2 border-black"
                    >
                      Withdraw Funds
                    </button>
                  </div>

                  <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
                    <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" /> Session Log
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black opacity-40">Earned</span>
                        <span className="font-black">1.2k TKN</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black opacity-40">Minutes</span>
                        <span className="font-black">142 Min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ANALYTICS SECTION */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic border-b-4 border-black pb-2">Insights</h3>
                  {!loadingStats && stats && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="neo-box bg-white p-6">
                        <h4 className="text-xl font-black uppercase mb-8">Performance History</h4>
                        <div className="flex items-end justify-between h-40 gap-2">
                          {stats.history.map((day: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                              <div className="w-full bg-zinc-100 h-full flex flex-col justify-end">
                                <div
                                  style={{ height: `${Math.min(100, (day.earnings / (Math.max(...stats.history.map((d: any) => d.earnings)) || 1)) * 100)}%` }}
                                  className="bg-neo-green w-full"
                                />
                              </div>
                              <span className="text-[8px] font-black uppercase text-zinc-400 rotate-45 mt-2">{day.date.split('-').slice(1).join('/')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-rows-2 gap-4">
                        <div className="neo-box bg-white p-4 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase opacity-40">Profile Views</span>
                          <span className="text-3xl font-black italic">{stats.total.view || 0}</span>
                        </div>
                        <div className="neo-box bg-white p-4 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase opacity-40">Total Calls</span>
                          <span className="text-3xl font-black italic">{stats.total.call_start || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* HIGHLIGHTS SECTION */}
                <div id="highlights-vault" className="space-y-6 scroll-mt-32">
                  <div className="border-b-4 border-black pb-2 flex justify-between items-end">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Highlights</h3>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Secure Cloud Vault</span>
                  </div>

                  {artifacts.length === 0 ? (
                    <div className="neo-box bg-white p-12 text-center border-dashed border-zinc-200">
                      <p className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.2em]">No recordings yet. Hit record during your next session!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {artifacts.map((art: any) => (
                        <div key={art.id} className="neo-box bg-white overflow-hidden group">
                          <div className="relative aspect-video bg-zinc-100 border-b-2 border-black">
                            <video src={art.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                              <button onClick={() => window.open(art.url, '_blank')} className="neo-btn bg-white text-black px-4 py-1 text-[8px] font-black">WATCH</button>
                            </div>
                          </div>
                          <div className="p-2 flex justify-between items-center text-[8px] font-black uppercase text-zinc-400">
                            {new Date(art.timestamp).toLocaleDateString()}
                            <button
                              onClick={() => {
                                if (confirm('Delete this highlight forever?')) {
                                  handleDeleteArtifact(art.id);
                                }
                              }}
                              className="hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence>


    </div>
  );
}