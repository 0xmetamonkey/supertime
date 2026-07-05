'use client';

import React, { useState, useEffect } from 'react';
import { AblyProvider, useCallSignaling } from '@/app/lib/ably';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  X,
  Activity,
  Radio,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
const SuperCall = dynamic(() => import('../components/SuperCall'), { ssr: false });
const BroadcastHost = dynamic(() => import('../components/Broadcast/BroadcastHost'), { ssr: false });
import { checkAvailability, completeOnboarding } from '../actions';
import { useClerk } from "@clerk/nextjs";
import WalletManager from '../components/WalletManager';
import GlobalStudioRecorder from '../dashboard/GlobalStudioRecorder';
import StudioVoice from '../components/StudioVoice';

export default function StudioClient({ username, session, initialSettings }: { username: string | null, session: any, initialSettings?: any }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const isSimulated = typeof window !== 'undefined' && window.location.search.includes('sim=true');

  const effectiveUsername = isSimulated ? (username || 'test-creator') : username;
  const ablySignaling = initialSettings?._ablySignaling;

  const [isLive, setIsLive] = useState(initialSettings?.isLive ?? false);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [pendingVideoRate, setPendingVideoRate] = useState(initialSettings?.videoRate ?? 100);
  const [pendingAudioRate, setPendingAudioRate] = useState(initialSettings?.audioRate ?? 50);
  const [pendingSocials, setPendingSocials] = useState(initialSettings?.socials ?? { instagram: '', x: '', youtube: '', website: '' });
  const [pendingProfileImage, setPendingProfileImage] = useState(initialSettings?.profileImage || '');
  const [pendingTemplates, setPendingTemplates] = useState<any[]>(initialSettings?.templates || []);
  const [artifacts, setArtifacts] = useState<any[]>(initialSettings?.artifacts || []);
  const [isUploading, setIsUploading] = useState(false);
  const [roomType, setRoomType] = useState<'audio' | 'video'>(initialSettings?.roomType || 'audio');
  const [isRoomFree, setIsRoomFree] = useState<boolean>(initialSettings?.isRoomFree ?? true);

  const [claimName, setClaimName] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');

  const [balance, setBalance] = useState<number | null>(null);
  const [withdrawable, setWithdrawable] = useState<number>(0);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [upiId, setUpiId] = useState(initialSettings?.upiId || '');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [isAcceptingCalls, setIsAcceptingCalls] = useState(initialSettings?.isAcceptingCalls ?? true);
  const [showDashboard, setShowDashboard] = useState(false);

  // 3-state status: 'online' | 'chilling' | 'offline'
  type StudioStatus = 'online' | 'chilling' | 'offline';
  const [studioStatus, setStudioStatus] = useState<StudioStatus>(
    initialSettings?.isAcceptingCalls ? 'online' : 'offline'
  );

  const STATUS_CONFIG: Record<StudioStatus, { label: string; dot: string; bg: string; text: string }> = {
    online:   { label: 'on the line', dot: 'bg-foreground animate-pulse', bg: 'bg-foreground text-background border-transparent', text: '' },
    chilling: { label: 'chilling',    dot: 'bg-muted',                    bg: 'bg-surface text-muted border-border',              text: '' },
    offline:  { label: 'offline',     dot: 'bg-muted opacity-40',         bg: 'bg-surface text-muted border-border opacity-60',   text: '' },
  };
  const STATUS_CYCLE: StudioStatus[] = ['online', 'chilling', 'offline'];

  const handleCycleStatus = async () => {
    const currentIdx = STATUS_CYCLE.indexOf(studioStatus);
    const next = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    setStudioStatus(next);
    const accepting = next === 'online';
    setIsAcceptingCalls(accepting);
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAcceptingCalls: accepting })
      });
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  // TalkTime state
  const [isTalkTimeCreating, setIsTalkTimeCreating] = useState(false);
  const [talkTimeRoom, setTalkTimeRoom] = useState<{ roomId: string; inviteUrl: string; hostUrl: string } | null>(null);
  const [talkTimeCopied, setTalkTimeCopied] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (ablySignaling?.activeCall) {
      setIsCalling(true);
      setCallType(ablySignaling.activeCall.type);
      setActiveChannelName(ablySignaling.activeCall.channelName);
    } else if (isCalling && !ablySignaling?.activeCall) {
      setIsCalling(false);
      setActiveChannelName(null);
      setCallDuration(0);
      setCreditsEarned(0);
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
      await completeOnboarding(claimName, 'creator');
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
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/call/book?mode=received');
        const data = await res.json();
        if (data.bookings) setBookings(data.bookings);
      } catch (e) {
        console.error("Failed to fetch bookings:", e);
      }
    };
    if (effectiveUsername) {
      fetchStats();
      fetchBookings();
    }
  }, [effectiveUsername]);

  useEffect(() => {
    if (isCalling) return;

    if (!effectiveUsername || !isLive) {
      if (activeChannelName?.startsWith('room-')) {
        setActiveChannelName(null);
      }
      return;
    }

    const broadcastChannel = `room-${effectiveUsername}`;
    if (activeChannelName !== broadcastChannel) {
      setActiveChannelName(broadcastChannel);
    }
  }, [isLive, isCalling, effectiveUsername, activeChannelName]);

  useEffect(() => {
    if (!isCalling || !isPeerConnected) return;
    const interval = setInterval(() => {
      setCallDuration(prev => {
        const next = prev + 1;
        const rate = callType === 'video' ? pendingVideoRate : pendingAudioRate;
        if (next % 60 === 0) setCreditsEarned(e => e + rate);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCalling, isPeerConnected, callType, pendingVideoRate, pendingAudioRate]);

  const handleEndCall = () => {
    setIsCalling(false);
    setActiveChannelName(null);
    setIsPeerConnected(false);
    setCallDuration(0);
    setCreditsEarned(0);
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

  // Calm timer — minutes only, no ticking seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins === 0) return 'just now';
    return `${mins} min`;
  };

  const handleCreateTalkTime = async () => {
    if (isTalkTimeCreating) return;
    setIsTalkTimeCreating(true);
    try {
      const res = await fetch('/api/talktime/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'TalkTime' }),
      });
      const data = await res.json();
      if (data.success) {
        setTalkTimeRoom({ roomId: data.roomId, inviteUrl: data.inviteUrl, hostUrl: data.hostUrl });
      } else {
        alert('Could not start TalkTime. Try again.');
      }
    } catch {
      alert('Network error. Try again.');
    } finally {
      setIsTalkTimeCreating(false);
    }
  };

  const copyTalkTimeLink = async () => {
    if (!talkTimeRoom) return;
    try {
      await navigator.clipboard.writeText(talkTimeRoom.inviteUrl);
      setTalkTimeCopied(true);
      setTimeout(() => setTalkTimeCopied(false), 2500);
    } catch {
      alert(talkTimeRoom.inviteUrl);
    }
  };

  const handleSendInvite = async () => {
    if (!talkTimeRoom || !inviteUsername.trim()) return;
    const clean = inviteUsername.replace(/^@/, '').trim();
    if (!clean) return;

    setInviteStatus('sending');
    setInviteError('');
    try {
      const res = await fetch('/api/talktime/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: clean,
          roomId: talkTimeRoom.roomId,
          roomTitle: 'TalkTime',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteStatus('sent');
        setInviteUsername('');
        setTimeout(() => setInviteStatus('idle'), 4000);
      } else {
        setInviteStatus('error');
        setInviteError(data.error || 'Could not find that user.');
      }
    } catch {
      setInviteStatus('error');
      setInviteError('Network error. Try again.');
    }
  };

  if (!effectiveUsername) {
    return (
      <main className="min-h-screen bg-background text-foreground font-sans selection:bg-rose-500 selection:text-white p-6 md:p-12">
        <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 border-b border-border pb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-foreground text-background flex items-center justify-center rounded-xl shadow-sm">
              <Zap className="w-4 h-4 text-yellow-500 fill-current" />
            </div>
            <h1 className="text-xl font-medium tracking-tight">Studio</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-surface text-foreground border border-border rounded-xl flex items-center justify-center hover:bg-background transition-all font-medium text-sm gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">Step 1 of your 10-year Empire</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                Supertime isn't just about calls. It's the infrastructure for your independence. Claim your unique link, exchange your energy for credits, and start building towards a billion-dollar outcome.
              </p>
            </div>
            <form onSubmit={handleClaim} className="space-y-6 pt-4">
              <div className="w-full">
                <label className="text-xs font-medium text-muted block mb-2 uppercase tracking-wider">Your Unique Link</label>
                <div className="flex flex-col sm:flex-row items-stretch bg-background border border-border rounded-xl focus-within:border-foreground transition-all overflow-hidden">
                  <div className="flex-1 flex items-center px-4 py-3 min-w-0">
                    <span className="text-muted text-sm pr-0.5 shrink-0">supertime.wtf/</span>
                    <input
                      type="text"
                      value={claimName}
                      onChange={(e) => setClaimName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="flex-1 bg-transparent border-none outline-none text-foreground font-medium text-sm placeholder:text-muted min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!claimName || claimLoading}
                    className="bg-foreground text-background font-medium px-6 py-3 sm:py-0 hover:opacity-90 transition-opacity disabled:opacity-50 text-sm flex items-center justify-center shrink-0"
                  >
                    {claimLoading ? '...' : 'Claim & Start'}
                  </button>
                </div>
              </div>
              {claimError && <p className="text-red-500 text-xs font-medium text-center">{claimError}</p>}
            </form>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm">
              <h3 className="text-sm font-medium text-muted mb-2">Energy Wallet</h3>
              <p className="font-semibold text-4xl mb-4 text-foreground tracking-tight">{balance ?? '0'} <span className="text-sm font-medium text-muted">Credits</span></p>
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Ready to use when you claim
              </div>
            </div>
          </div>
        </div>
        {effectiveUsername && <GlobalStudioRecorder username={effectiveUsername} />}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-rose-500 selection:text-white">
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
        <div className="fixed inset-0 z-[500] bg-black">
          <div className="absolute top-6 left-6 right-6 z-[510] flex items-center justify-start">
            <div className="flex items-center gap-2">
              <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
                <span className="text-green-500 text-sm font-semibold tabular-nums">+{creditsEarned.toFixed(0)} Credits</span>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl">
                <span className="text-white text-sm font-semibold tabular-nums">{formatTime(callDuration)}</span>
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

      {/* HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border py-4 transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-surface flex items-center justify-center border border-border rounded-lg shadow-sm transition-transform group-hover:rotate-12">
                <Zap className="text-yellow-500 w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Studio</span>
              {isLive && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 rounded-full border border-red-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">Live</span>
                </div>
              )}
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href={`/${username}`} className="text-xs text-muted hover:text-foreground transition-colors">Public Profile</Link>
              <button
                onClick={() => setShowDashboard(true)}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                Command Center
              </button>
              <Link href="/studio/settings" className="text-xs text-muted hover:text-foreground transition-colors">Settings</Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="hidden md:flex px-4 py-2 bg-surface text-foreground border border-border rounded-xl items-center justify-center hover:bg-background transition-all font-medium text-sm gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>

            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden w-10 h-10 bg-foreground text-background rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-md"
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
            className="fixed inset-0 z-[10000] bg-background flex flex-col p-8 md:hidden"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 flex justify-between items-center mb-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-surface flex items-center justify-center border border-border rounded-xl">
                  <Zap className="text-yellow-500 w-6 h-6 fill-current" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-foreground">Menu</span>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-12 h-12 bg-foreground text-background rounded-2xl flex items-center justify-center shadow-md transition-all"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="relative z-10 flex flex-col gap-6 flex-1">
              <Link
                href={`/${username}`}
                onClick={() => setShowMobileMenu(false)}
                className="text-3xl font-bold tracking-tight text-foreground hover:text-rose-500 border-b border-border pb-6 transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  router.push('/dashboard?tab=tools');
                }}
                className="text-3xl font-bold tracking-tight text-foreground hover:text-blue-500 text-left border-b border-border pb-6 transition-colors"
              >
                Tools
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  router.push('/wallet');
                }}
                className="text-3xl font-bold tracking-tight text-green-500 hover:text-yellow-500 text-left border-b border-border pb-6 transition-colors"
              >
                Vault
              </button>
              <Link
                href="/studio/settings"
                onClick={() => setShowMobileMenu(false)}
                className="text-3xl font-bold tracking-tight text-foreground hover:text-rose-500 text-left border-b border-border pb-6 transition-colors block"
              >
                Settings
              </Link>
            </div>

            <div className="relative z-10 pt-8">
              <button
                onClick={() => signOut(() => { window.location.href = "/"; })}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold tracking-tight flex items-center justify-center gap-4 shadow-md transition-all hover:bg-red-700"
              >
                <LogOut className="w-6 h-6" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-32">
        <div className="grid lg:grid-cols-12 gap-12 mt-12">
          {/* QUEUE & SCHEDULE */}
          <div className="lg:col-span-12">
            <div className="grid md:grid-cols-2 gap-8">
              {/* WAITLIST */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium text-foreground tracking-tight">Waitlist</h3>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold bg-surface text-muted px-2.5 py-0.5 rounded-full">{requests.length}</span>
                </div>
                {requests.length === 0 ? (
                  <div className="border border-border border-dashed p-10 text-center rounded-2xl bg-surface">
                    <p className="text-xs text-muted font-medium">Queue is currently empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req, i) => (
                      <div key={i} className="bg-surface border border-border p-4 rounded-xl flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-background text-xs font-medium text-muted flex items-center justify-center border border-border">#{i + 1}</div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{req.from || 'Guest'}</p>
                            <p className="text-xs text-muted mt-0.5">{new Date(req.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <button className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted hover:bg-surface transition-colors">
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
                  <h3 className="text-lg font-medium text-foreground tracking-tight">Schedule</h3>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold bg-surface text-muted px-2.5 py-0.5 rounded-full">{bookings.length}</span>
                </div>
                {bookings.length === 0 ? (
                  <div className="border border-border border-dashed p-10 text-center rounded-2xl bg-surface">
                    <p className="text-xs text-muted font-medium">No bookings scheduled today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking, i) => (
                      <div key={i} className="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-indigo-500">{booking.date} @ {booking.time}</span>
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        </div>
                        <p className="font-medium text-base text-foreground mb-1">{booking.visitorEmail.split('@')[0]}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted">{booking.duration} Min {booking.type}</span>
                          <button onClick={() => window.open(`mailto:${booking.visitorEmail}`)} className="text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline transition-all">Notify Client</button>
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
      <div className="fixed bottom-0 left-0 right-0 z-[90] bg-background/80 backdrop-blur-md border-t border-border p-4 flex justify-between items-center gap-3">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Go Live / End Stream */}
          <button
            onClick={() => {
              const next = !isLive;
              setIsLive(next);
              fetch('/api/studio/update', { method: 'POST', body: JSON.stringify({ isLive: next }) });
            }}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
              isLive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isLive ? 'End Stream' : 'Go Live'}
          </button>

          {/* 3-State Status Pill */}
          <button
            onClick={handleCycleStatus}
            className={`flex-1 md:flex-none flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm border ${STATUS_CONFIG[studioStatus].bg}`}
            title="Tap to cycle status"
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CONFIG[studioStatus].dot}`} />
            <span className="whitespace-nowrap">{STATUS_CONFIG[studioStatus].label}</span>
          </button>

          {/* / TalkTime */}
          <button
            onClick={handleCreateTalkTime}
            disabled={isTalkTimeCreating}
            className="hidden md:flex flex-1 md:flex-none items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-rose-500 text-white shadow-md hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTalkTimeCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            / TalkTime
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* The Voice Orb */}
          {effectiveUsername && (
            <StudioVoice
              username={effectiveUsername}
              isLive={isLive}
              studioStatus={studioStatus}
            />
          )}

          <button
            onClick={() => setShowDashboard(true)}
            className="hidden md:flex px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm border border-border bg-surface hover:bg-background text-foreground items-center gap-2 group"
          >
            <LayoutDashboard className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" /> Command Center
          </button>
        </div>
      </div>

      {/* TALKTIME INVITE MODAL */}
      <AnimatePresence>
        {talkTimeRoom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-background/60 backdrop-blur-xl"
            onClick={(e) => { if (e.target === e.currentTarget) setTalkTimeRoom(null); }}
          >
            <motion.div
              initial={{ y: 30, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.96 }}
              className="relative w-full max-w-md bg-background/95 backdrop-blur-3xl border border-violet-500/20 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Ambient */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/3 -right-1/4 w-2/3 h-2/3 bg-violet-500/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-1/3 -left-1/4 w-2/3 h-2/3 bg-rose-500/8 blur-[100px] rounded-full" />
              </div>

              <div className="relative z-10 flex flex-col items-center p-8 text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-violet-500/30 rounded-3xl flex items-center justify-center shadow-xl">
                    <Radio className="w-10 h-10 text-violet-400" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs font-bold uppercase tracking-widest text-violet-400">TalkTime is live</span>
                  <h3 className="text-2xl font-bold tracking-tight">Your room is ready.</h3>
                  <p className="text-sm text-muted">Share this link — no account needed. They&apos;ll join in seconds.</p>
                </div>

                {/* Invite URL */}
                <div className="w-full bg-surface/60 border border-border rounded-2xl flex items-center gap-3 px-4 py-3">
                  <span className="flex-1 text-xs text-muted font-mono truncate text-left">{talkTimeRoom.inviteUrl}</span>
                  <button
                    onClick={copyTalkTimeLink}
                    className="flex-shrink-0 w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-surface transition-all text-muted hover:text-foreground"
                  >
                    {talkTimeCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* ── Invite a Supertime User ── */}
                <div className="w-full space-y-2">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider text-left">Or invite by username</p>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center bg-background border border-border rounded-xl px-3 py-2.5 focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all">
                      <span className="text-violet-400 font-bold text-sm mr-1">@</span>
                      <input
                        type="text"
                        value={inviteUsername}
                        onChange={e => { setInviteUsername(e.target.value.replace(/^@/, '').toLowerCase()); setInviteStatus('idle'); setInviteError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleSendInvite()}
                        placeholder="username"
                        className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-medium placeholder:text-muted/50"
                        maxLength={32}
                      />
                    </div>
                    <button
                      onClick={handleSendInvite}
                      disabled={!inviteUsername.trim() || inviteStatus === 'sending'}
                      className="px-4 py-2.5 bg-violet-600 text-white font-bold text-sm rounded-xl hover:bg-violet-500 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {inviteStatus === 'sending' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : inviteStatus === 'sent' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      {inviteStatus === 'sent' ? 'Sent!' : 'Send'}
                    </button>
                  </div>
                  {inviteStatus === 'sent' && (
                    <p className="text-xs text-green-500 font-medium text-left">✓ Invite sent — they'll get an email, push notification, and in-app ping.</p>
                  )}
                  {inviteStatus === 'error' && (
                    <p className="text-xs text-red-400 font-medium text-left">✗ {inviteError}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => window.location.href = talkTimeRoom.hostUrl}
                    className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-bold rounded-2xl text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <Sparkles className="w-4 h-4" /> Join as Host <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setTalkTimeRoom(null); setInviteUsername(''); setInviteStatus('idle'); }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-surface border border-border text-muted rounded-2xl text-sm font-medium hover:bg-background hover:text-foreground transition-all"
                  >
                    <X className="w-4 h-4" /> Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMMERSIVE COMMAND CENTER MODAL */}
      <AnimatePresence>
        {showDashboard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-4 md:inset-8 z-[1000] bg-background/95 backdrop-blur-3xl border border-border flex flex-col shadow-2xl rounded-3xl overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-border bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-background border border-border rounded-xl flex items-center justify-center shadow-sm">
                  <Activity className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">Command Center</h3>
                  <p className="text-xs text-muted">Your analytics, economy, and highlights vault.</p>
                </div>
              </div>
              <button
                onClick={() => setShowDashboard(false)}
                className="w-10 h-10 rounded-xl bg-background border border-border text-muted hover:text-foreground hover:border-foreground flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 custom-scrollbar">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm text-foreground relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all" />
                  <h3 className="text-sm font-medium text-muted mb-1 relative z-10">Energy Wallet</h3>
                  <p className="font-bold text-4xl mb-4 tracking-tight tabular-nums relative z-10">{balance ?? '0'} <span className="text-lg font-medium text-muted">Credits</span></p>
                  <div className="relative z-10">
                    <WalletManager onBalanceChange={setBalance} />
                  </div>
                </div>

                <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm text-foreground relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all" />
                  <h3 className="text-sm font-medium text-muted mb-1 relative z-10">Earnings Ready</h3>
                  <p className="font-bold text-4xl mb-4 tracking-tight tabular-nums relative z-10">₹{withdrawable}</p>
                  <button
                    onClick={() => router.push('/dashboard?tab=wallet')}
                    className="w-full bg-foreground text-background py-2.5 font-medium text-sm rounded-xl shadow-sm hover:opacity-90 transition-opacity relative z-10"
                  >
                    Withdraw to Bank
                  </button>
                </div>

                <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm text-foreground relative overflow-hidden group">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />
                  <h3 className="text-sm font-medium text-muted mb-4 flex items-center gap-2 relative z-10">
                    <Clock className="w-4 h-4 text-blue-500" /> Sesh Log
                  </h3>
                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                      <span className="font-medium text-muted">Earned Today</span>
                      <span className="font-bold text-foreground">1.2k Credits</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-muted">Active Minutes</span>
                      <span className="font-bold text-foreground">142 Min</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ANALYTICS SECTION */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-foreground border-b border-border pb-3 tracking-tight">Insights & Growth</h3>
                {!loadingStats && stats && (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm text-foreground">
                      <h4 className="text-sm font-medium text-muted mb-8">Performance History</h4>
                      <div className="flex items-end justify-between h-40 gap-2">
                        {stats.history.map((day: any, i: number) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                            <div className="w-full bg-background border border-border h-full flex flex-col justify-end rounded-lg overflow-hidden">
                              <div
                                style={{ height: `${Math.min(100, (day.earnings / (Math.max(...stats.history.map((d: any) => d.earnings)) || 1)) * 100)}%` }}
                                className="bg-foreground w-full opacity-50 group-hover:opacity-100 transition-opacity"
                              />
                            </div>
                            <span className="text-[10px] font-medium text-muted">{day.date.split('-').slice(1).join('/')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-rows-2 gap-4">
                      <div className="bg-surface border border-border p-6 rounded-2xl flex justify-between items-center shadow-sm text-foreground">
                        <span className="text-sm font-medium text-muted">Profile Views</span>
                        <span className="text-3xl font-bold tracking-tight">{stats.total.view || 0}</span>
                      </div>
                      <div className="bg-surface border border-border p-6 rounded-2xl flex justify-between items-center shadow-sm text-foreground">
                        <span className="text-sm font-medium text-muted">Total Conversations</span>
                        <span className="text-3xl font-bold tracking-tight">{stats.total.call_start || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* HIGHLIGHTS SECTION */}
              <div id="highlights-vault" className="space-y-6">
                <div className="border-b border-border pb-3 flex justify-between items-end">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">Highlights Vault</h3>
                  <span className="text-xs text-muted font-medium bg-surface px-2 py-1 rounded-md border border-border">Secure Cloud</span>
                </div>

                {artifacts.length === 0 ? (
                  <div className="border border-border border-dashed p-16 text-center rounded-3xl bg-surface">
                    <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center border border-border mx-auto mb-4">
                      <Camera className="w-6 h-6 text-muted" />
                    </div>
                    <h4 className="text-lg font-medium text-foreground mb-1">No recordings yet</h4>
                    <p className="text-sm text-muted font-medium max-w-sm mx-auto">Hit record during your next sesh to save your best moments directly to your vault.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {artifacts.map((art: any) => (
                      <div key={art.id} className="bg-surface border border-border rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="relative aspect-video bg-background border-b border-border overflow-hidden">
                          <video src={art.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm">
                            <button onClick={() => window.open(art.url, '_blank')} className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-1.5">
                              <Play className="w-3 h-3 fill-current" /> WATCH
                            </button>
                          </div>
                        </div>
                        <div className="p-4 flex justify-between items-center text-xs text-muted font-medium bg-surface">
                          {new Date(art.timestamp).toLocaleDateString()}
                          <button
                            onClick={() => {
                                if (confirm('Delete this highlight forever?')) {
                                  handleDeleteArtifact(art.id);
                                }
                            }}
                            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Studio Recorder */}
      {effectiveUsername && <GlobalStudioRecorder username={effectiveUsername} />}
    </div>
  );
}