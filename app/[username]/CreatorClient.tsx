'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Globe,
  Heart,
  Clock,
  Sparkles,
  ArrowRight,
  Mic,
  Video,
  Instagram,
  Link as LinkIcon
} from 'lucide-react';
import WalletManager from '../components/WalletManager';
import dynamic from 'next/dynamic';
const SuperCall = dynamic(() => import('../components/SuperCall'), { ssr: false });
const BroadcastViewer = dynamic(() => import('../components/Broadcast/BroadcastViewer'), { ssr: false });
import { loginWithGoogle, logout } from '../actions';

interface CreatorClientProps {
  username: string,
  user: any,
  isOwner: boolean,
  ownerEmail: string,
  isVerified?: boolean,
  socials?: any,
  videoRate?: number;
  audioRate?: number;
  profileImage?: string;
  isLive?: boolean;
  isAcceptingCalls?: boolean;
  templates?: any[];
  availability?: any;
  artifacts?: any[];
  roomType?: 'audio' | 'video';
  isRoomFree?: boolean;
  studioMode?: 'solitude' | 'theatre' | 'private';
  _ablySignaling?: any; // Injected from CreatorWrapper for real-time signaling
}

export default function CreatorClient({
  username,
  user,
  isOwner,
  ownerEmail,
  isVerified,
  socials,
  videoRate = 100,
  audioRate = 50,
  profileImage = "",
  isLive = true,
  isAcceptingCalls = true,
  templates = [],
  availability = {},
  artifacts = [],
  roomType = 'audio',
  isRoomFree = true,
  studioMode = 'solitude',
  _ablySignaling
}: CreatorClientProps) {

  const [guestId] = useState(() => Math.random().toString(36).slice(2, 7));
  const uid = user?.id || `guest-${guestId}`;
  const isLoggedIn = !!user;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSimulated = searchParams.get('sim') === 'true';

  // State
  const [balance, setBalance] = useState<number>(5000); // TEST MODE: Backdoor Enabled
  const [isCalling, setIsCalling] = useState(false);
  const [isWatching, setIsWatching] = useState(false); // Watching broadcast (Theatre mode)
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [tokensSpent, setTokensSpent] = useState(0);
  const [isCreatorOnline, setIsCreatorOnline] = useState(isLive);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingTemplate, setBookingTemplate] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false);

  const lastDeductMinuteRef = useRef<number>(-1);
  // Handle joining Theatre mode broadcast (watch stream)
  const handleJoinRoom = async () => {
    if (!isLoggedIn && !isRoomFree && !isSimulated) {
      loginWithGoogle(window.location.pathname);
      return;
    }

    if (isOwner) {
      window.location.href = '/studio';
      return;
    }

    // Theatre mode = watch stream (BroadcastViewer)
    setActiveChannelName(`room-${username}`);
    setIsWatching(true);
    setCallDuration(0);
    setTokensSpent(0);
    lastDeductMinuteRef.current = 0;

    // Track stream join
    fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event: 'stream_join', username })
    });
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!isLoggedIn && !isSimulated) {
      loginWithGoogle(window.location.pathname);
      return;
    }

    if (isOwner) {
      showError("You can't call yourself! Go to Studio to receive calls.");
      return;
    }

    const currentRate = type === 'video' ? videoRate : audioRate;

    if (balance < currentRate && !isSimulated) {
      showError(`Add ${currentRate} TKN to start a ${type} call.`);
      return;
    }

    if (!isAcceptingCalls && !isSimulated) {
      showError(`${username} is not accepting calls right now. Try again soon!`);
      return;
    }

    console.log('[Caller] Starting call...', { type, providerConnected: _ablySignaling?.isConnected });
    let callChannelName: string | null = null;
    try {
      // Use Ably for instant signaling if available
      if (_ablySignaling?.isConnected && _ablySignaling?.initiateCall) {
        console.log('[Caller] Using Ably to initiate call to:', username);
        callChannelName = await _ablySignaling.initiateCall(username, type);
        setActiveChannelName(callChannelName);
      } else {
        // Fallback to old API if Ably not connected
        console.log('[Caller] Fallback: Using signal API');
        const response = await fetch('/api/call/signal', {
          method: 'POST',
          body: JSON.stringify({ action: 'call', from: uid, to: username, type })
        });
        const data = await response.json();

        if (data.success && data.channelName) {
          callChannelName = data.channelName;
          setActiveChannelName(data.channelName);
        } else {
          showError("Failed to connect. Please try again.");
          return;
        }
      }
    } catch (e) {
      console.error('[Caller] Error initiating call:', e);
      showError("Connection error. Please try again.");
      return;
    }

    setCallType(type);
    setIsCalling(true);
    setCallDuration(0);
    setTokensSpent(0);
    // Initialize to -1 so the first minute (0) is charged when handleTimeUpdate starts
    lastDeductMinuteRef.current = -1;

    // Track Call Initiation (Not start yet)
    fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event: 'call_initiate', username })
    });
  };

  const handleTimeUpdate = React.useCallback(async (seconds: number) => {
    const currentMinute = Math.floor(seconds / 60);
    const currentRate = callType === 'video' ? videoRate : audioRate;
    const isRoom = activeChannelName?.startsWith('room-');

    console.log(`[Timer] Tick: ${seconds}s, CurrentMinute: ${currentMinute}, LastMinute: ${lastDeductMinuteRef.current}`);

    if (currentMinute > lastDeductMinuteRef.current) {
      console.log(`[Timer] 🔔 NEW MINUTE DETECTED: Charging ${currentRate} TKN`);
      lastDeductMinuteRef.current = currentMinute;
      if (!(isRoom && isRoomFree) && !isSimulated) {
        const success = await deductBalance(currentRate);
        if (success) {
          setTokensSpent(prev => prev + currentRate);
          // Track Earning
          fetch('/api/analytics/track', {
            method: 'POST',
            body: JSON.stringify({ event: 'earning', username, metadata: { amount: currentRate } })
          });
        }
      }
    }
    setCallDuration(seconds);
  }, [callType, videoRate, audioRate, activeChannelName, isRoomFree, isSimulated, username]);

  const [incomingCall, setIncomingCall] = useState<any>(null);

  // Timer for active calls (billing)
  useEffect(() => {
    if (!isCalling || !isPeerConnected) return; // Only run timer if call is active and peer is connected
    const interval = setInterval(() => {
      setCallDuration(prev => {
        const next = prev + 1;
        handleTimeUpdate(next); // Deduct balance every minute
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCalling, isPeerConnected, handleTimeUpdate]); // Add handleTimeUpdate to dependencies

  useEffect(() => {
    if (!isOwner || isCalling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/call/signal?username=${username}`);
        const data = await res.json();
        if (data.incoming) setIncomingCall(data.incoming);
        else setIncomingCall(null);
      } catch (e) { }
    }, 3000);
    return () => clearInterval(interval);
  }, [isOwner, isCalling, username]);

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
        body: JSON.stringify({ action: 'reject', from: uid, to: username })
      });
    } catch (e) { }
    setIncomingCall(null);
  };

  const handleEndCall = async () => {
    setIsCalling(false);
    setCallDuration(0);
    setActiveChannelName(null);
    lastDeductMinuteRef.current = 0;
    setIsPeerConnected(false); // Reset peer connection status
    try {
      await fetch('/api/call/signal', {
        method: 'POST',
        body: JSON.stringify({ action: 'end', from: uid, to: username })
      });
    } catch (e) { }
  };

  const deductBalance = async (amount: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct_split', amount, recipientEmail: ownerEmail })
      });

      if (res.status === 402) {
        showError("Out of tokens! Call ending...");
        handleEndCall();
        return false;
      }
      const data = await res.json();
      setBalance(data.balance);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleBookCall = async () => {
    if (!bookingDate || !bookingTime || !bookingTemplate) {
      alert("Please select date, time and a session template.");
      return;
    }
    setIsBooking(true);
    try {
      const res = await fetch('/api/call/book', {
        method: 'POST',
        body: JSON.stringify({
          creatorUsername: username,
          date: bookingDate,
          time: bookingTime,
          templateId: bookingTemplate.id,
          type: bookingTemplate.type,
          duration: bookingTemplate.duration,
          price: bookingTemplate.price
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Booking Request Sent!");
        setShowBookingModal(false);
      } else {
        alert("Booking failed: " + data.error);
      }
    } catch (e) {
      alert("Booking failed.");
    } finally {
      setIsBooking(false);
    }
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const [admirerCount, setAdmirerCount] = useState(0);
  const [isAdmiring, setIsAdmiring] = useState(false);

  useEffect(() => {
    fetch(`/api/user/admire?username=${username}`)
      .then(res => res.json())
      .then(data => {
        setAdmirerCount(data.count);
        setIsAdmiring(data.isAdmiring);
      });
  }, [username]);

  const toggleAdmire = async () => {
    if (!isLoggedIn) {
      loginWithGoogle(window.location.pathname);
      return;
    }
    const newStatus = !isAdmiring;
    setIsAdmiring(newStatus);
    setAdmirerCount(prev => newStatus ? prev + 1 : prev - 1);
    await fetch('/api/user/admire', {
      method: 'POST',
      body: JSON.stringify({ username, action: newStatus ? 'admire' : 'unadmire' })
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-neo-pink selection:text-white pb-20">
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-red-500 text-white font-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] uppercase text-sm"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b-4 border-black py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_theme(colors.neo-pink)] transition-transform group-hover:rotate-12">
              <Zap className="text-neo-yellow w-5 h-5 fill-neo-yellow" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter">Supertime</span>
          </a>

          <div className="flex items-center gap-4">
            {isOwner && (
              <button
                onClick={() => window.location.href = '/studio'}
                className="neo-btn bg-neo-green text-black text-xs px-4 py-2 hidden md:block"
              >
                My Studio
              </button>
            )}
            {isLoggedIn ? (
              <WalletManager onBalanceChange={setBalance} />
            ) : (
              <button
                onClick={() => loginWithGoogle(window.location.pathname)}
                className="neo-btn bg-black text-white text-xs px-4 py-2"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {incomingCall && !isCalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-neo-yellow/40 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, rotate: -2 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white border-8 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] md:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] p-6 md:p-12 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 bg-neo-pink border-4 border-black mx-auto mb-6 flex items-center justify-center text-3xl md:text-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                👤
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-2 break-words">{incomingCall.from || 'Guest'}</h2>
              <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-8 md:mb-12 text-zinc-400">Incoming {incomingCall.type} call</p>
              <div className="flex gap-4">
                <button onClick={handleRejectCall} className="flex-1 neo-btn bg-red-500 text-white py-4">REJECT</button>
                <button onClick={() => handleAcceptCall(incomingCall.type)} className="flex-1 neo-btn bg-neo-green text-black py-4 animate-bounce">ACCEPT</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watching Stream (Theatre mode) → BroadcastViewer */}
      {isWatching && activeChannelName && (
        <BroadcastViewer
          channelName={activeChannelName}
          uid={uid}
          creatorUsername={username}
          userBalance={balance}
          onLeave={() => {
            setIsWatching(false);
            setActiveChannelName(null);
          }}
          onRequestCall={(type) => {
            // Fan wants 1:1 call from within stream
            setIsWatching(false);
            handleStartCall(type);
          }}
        />
      )}

      {/* 1:1 Call → SuperCall */}
      {isCalling && activeChannelName && (
        <div className="fixed inset-0 z-[300] bg-black">
          {/* Status Bar for 1:1 calls */}
          <div className="absolute top-4 left-4 right-4 z-[310] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-black uppercase tracking-wider">
                1:1 with {username}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-neo-yellow px-3 py-1 border-2 border-black">
                <span className="text-sm font-black tabular-nums">{formatTime(callDuration)}</span>
              </div>
              <div className="bg-neo-pink px-3 py-1 border-2 border-black text-white">
                <span className="text-sm font-black tabular-nums">-{tokensSpent} TKN</span>
              </div>
            </div>
          </div>
          <SuperCall
            key={activeChannelName}
            channelName={activeChannelName}
            uid={uid}
            type={callType!}
            onDisconnect={handleEndCall}
            onPeerJoined={() => setIsPeerConnected(true)}
            onPeerLeft={() => setIsPeerConnected(false)}
          />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32">
        <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
          <div className="lg:col-span-5 space-y-8">
            <div className="relative inline-block">
              <div className="w-32 h-32 md:w-48 md:h-48 bg-white border-4 md:border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt={username} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt={username} className="w-full h-full object-cover" />
                )}
              </div>
              {isCreatorOnline && (
                <div className="absolute -top-4 -right-4 bg-neo-green border-4 border-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-xs animate-bounce">Live Now</div>
              )}
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-7xl font-black uppercase leading-[0.9] md:leading-[0.8] tracking-tighter flex items-center gap-2 md:gap-4 flex-wrap break-words">
                {username}
                {isVerified && <Zap className="w-8 h-8 md:w-12 md:h-12 text-neo-blue fill-neo-blue" />}
              </h1>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={toggleAdmire}
                  disabled={isOwner}
                  className={`flex items-center gap-2 border-4 border-black px-4 py-2 font-black uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${isAdmiring ? 'bg-neo-pink text-white' : 'bg-white text-black'}`}
                >
                  <Heart className={`w-5 h-5 ${isAdmiring ? 'fill-white' : ''}`} />
                  {admirerCount} Admirers
                </button>
                {/* Social Links - Restored for MVP */}
                {socials?.instagram && (
                  <a
                    href={`https://instagram.com/${socials.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border-4 border-black px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {socials?.x && (
                  <a
                    href={`https://x.com/${socials.x}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border-4 border-black px-4 py-2 bg-black text-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                  >
                    𝕏
                  </a>
                )}
                {socials?.website && (
                  <a
                    href={socials.website.startsWith('http') ? socials.website : `https://${socials.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border-4 border-black px-4 py-2 bg-neo-blue text-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
            {isOwner ? (
              <div className="bg-neo-blue/10 border-4 border-black border-dashed p-8 space-y-4">
                <h3 className="text-xl font-black uppercase">Your Creator Profile</h3>
                <p className="font-bold text-zinc-600 uppercase text-xs tracking-widest leading-relaxed">This is how your audience sees you.</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); showError("URL Copied!"); }} className="neo-btn bg-black text-white px-6 py-3">Copy Link</button>
                  <button onClick={() => window.location.href = '/studio'} className="neo-btn bg-neo-green text-black px-6 py-3">Go to Studio</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* PRIMARY: Watch Stream (if Live) */}
                {isLive && (
                  <button
                    onClick={handleJoinRoom}
                    className="w-full bg-neo-blue border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all text-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full border-2 border-black flex items-center justify-center">
                        <Video className="w-6 h-6 text-black" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black uppercase">Watch Live Stream</span>
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        </div>
                        <p className="text-xs font-bold uppercase opacity-80">
                          Room is Open
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  </button>
                )}

                {/* SECONDARY: Direct Call Options */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleStartCall('video')}
                    className="bg-neo-pink text-white py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all flex flex-col items-center"
                  >
                    <Video className="w-6 h-6 mb-1" />
                    <span className="text-sm font-black">VIDEO</span>
                    <span className="text-[10px] opacity-80">{videoRate} TKN/min</span>
                  </button>
                  <button
                    onClick={() => handleStartCall('audio')}
                    className="bg-neo-blue text-white py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all flex flex-col items-center"
                  >
                    <Mic className="w-6 h-6 mb-1" />
                    <span className="text-sm font-black">AUDIO</span>
                    <span className="text-[10px] opacity-80">{audioRate} TKN/min</span>
                  </button>
                </div>

                {/* Schedule - Hidden for MVP simplicity */}
                {/* 
                <div className="bg-neo-yellow border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-center text-black">
                    <span className="text-sm font-black uppercase">Book Later</span>
                    <button className="bg-black text-white text-xs px-3 py-1">Schedule</button>
                  </div>
                </div>
                */}
              </div>
            )}
          </div>
          <div className="lg:col-span-7 space-y-12">
            {templates && templates.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4"><h3 className="text-3xl font-black uppercase tracking-tighter">Packages</h3><div className="h-2 flex-1 bg-black" /></div>
                <div className="grid md:grid-cols-2 gap-6">
                  {templates.map((tpl: any) => (
                    <button key={tpl.id} onClick={() => handleStartCall(tpl.type)} className="group neo-box bg-white p-6 text-left hover:scale-[1.02] transition-transform flex flex-col min-h-[180px]">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 border-2 border-black font-black uppercase text-[10px] ${tpl.type === 'video' ? 'bg-neo-pink text-white' : 'bg-neo-blue text-white'}`}>{tpl.type}</span>
                        <span className="font-black text-lg underline decoration-neo-green decoration-4 underline-offset-4">{tpl.price} TKN</span>
                      </div>
                      <h4 className="text-2xl font-black uppercase mb-2 group-hover:text-neo-pink transition-colors">{tpl.duration} Min Session</h4>
                      <p className="text-sm font-bold text-zinc-500 uppercase leading-relaxed">{tpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {artifacts && artifacts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4"><h3 className="text-3xl font-black uppercase tracking-tighter text-black">Highlights</h3><div className="h-2 flex-1 bg-black" /></div>
                <div className="grid md:grid-cols-2 gap-8">
                  {artifacts.map((art: any) => (
                    <div key={art.id} className="neo-box bg-white overflow-hidden group">
                      <div className="relative aspect-video bg-zinc-100 border-b-4 border-black">
                        <video src={art.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" onMouseEnter={(e) => (e.target as HTMLVideoElement).play()} onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()} muted loop />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                          <span className="font-black uppercase text-[10px] text-white tracking-widest">{new Date(art.timestamp).toLocaleDateString()}</span>
                          <button onClick={() => window.open(art.url, '_blank')} className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"><Zap className="w-5 h-5 text-neo-pink fill-neo-pink" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showBookingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full">
              <div className="flex justify-between items-start mb-8 text-black">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Book Session</h2>
                <button onClick={() => setShowBookingModal(false)} className="w-8 h-8 border-2 border-black flex items-center justify-center font-black">✕</button>
              </div>
              <div className="space-y-6 text-black">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest block">Date</label>
                    <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full bg-zinc-50 border-4 border-black p-3 font-bold text-sm outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest block">Time</label>
                    <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full bg-zinc-50 border-4 border-black p-3 font-bold text-sm outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block">Package</label>
                  <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {templates.map((tpl: any) => (
                      <button key={tpl.id} onClick={() => setBookingTemplate(tpl)} className={`w-full text-left p-3 border-4 border-black font-bold text-xs flex justify-between items-center ${bookingTemplate?.id === tpl.id ? 'bg-neo-yellow' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}>
                        <span>{tpl.duration} Min {tpl.type}</span>
                        <span className="font-black">{tpl.price} TKN</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-4">
                <button onClick={() => setShowBookingModal(false)} className="flex-1 font-black uppercase text-xs py-4 text-black">Cancel</button>
                <button onClick={handleBookCall} disabled={isBooking || !bookingDate || !bookingTime || !bookingTemplate} className="flex-1 neo-btn bg-neo-green text-black py-4 disabled:opacity-50">{isBooking ? '...' : 'Reserve'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-20 py-12 border-t-4 border-black bg-zinc-50 text-black">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-6 opacity-30"><Zap className="w-5 h-5 fill-black" /><span className="font-black uppercase text-xs">Supertime</span></div>
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em]">Blissful Art</p>
        </div>
      </footer>
    </div>
  );
}
