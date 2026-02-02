'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Globe,
  Heart,
  Clock,
  Sparkles,
  ArrowRight,
  Mic,
  Video
} from 'lucide-react';
import WalletManager from '../components/WalletManager';
import dynamic from 'next/dynamic';
const AgoraCall = dynamic(() => import('../components/AgoraCall'), { ssr: false });
import { useSession } from 'next-auth/react';
import { useTheme } from '../context/ThemeContext';
import { logout, loginWithGoogle } from '../actions';
import ThemeToggle from '../components/ThemeToggle';

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
  templates?: any[];
  availability?: any;
  artifacts?: any[];
  roomType?: 'audio' | 'video';
  isRoomFree?: boolean;
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
  templates = [],
  availability = {},
  artifacts = [],
  roomType = 'audio',
  isRoomFree = true
}: CreatorClientProps) {

  const [guestId] = useState(() => Math.random().toString(36).slice(2, 7));
  const uid = user?.id || `guest-${guestId}`;
  const isLoggedIn = !!user;
  const router = useRouter();

  // State
  const [balance, setBalance] = useState<number>(0);
  const [isCalling, setIsCalling] = useState(false);
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

  const lastDeductMinuteRef = useRef<number>(0);

  const handleJoinRoom = async () => {
    if (!isLoggedIn && !isRoomFree) {
      loginWithGoogle(window.location.pathname);
      return;
    }

    if (isOwner) {
      // Owners are already in the room via Studio, but if they are on their profile...
      window.location.href = '/studio';
      return;
    }

    const currentRate = roomType === 'video' ? videoRate : audioRate;

    if (!isRoomFree && balance < currentRate) {
      showError(`${currentRate} TKN required to join ${roomType} room.`);
      return;
    }

    setActiveChannelName(`room-${username}`);
    setCallType(roomType);
    setIsCalling(true);
    setCallDuration(0);
    setTokensSpent(0);
    lastDeductMinuteRef.current = 0;

    if (!isRoomFree) {
      await deductBalance(currentRate);
      setTokensSpent(currentRate);
    }
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!isLoggedIn) {
      loginWithGoogle(window.location.pathname);
      return;
    }

    if (isOwner) {
      showError("You can't call yourself! Go to Studio to receive calls.");
      return;
    }

    const currentRate = type === 'video' ? videoRate : audioRate;

    if (balance < currentRate) {
      showError(`Add ${currentRate} TKN to start a ${type} call.`);
      return;
    }

    let callChannelName: string | null = null;
    try {
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
    } catch (e) {
      showError("Connection error. Please try again.");
      return;
    }

    setCallType(type);
    setIsCalling(true);
    setCallDuration(0);
    setTokensSpent(0);
    lastDeductMinuteRef.current = 0;

    await deductBalance(currentRate);
    setTokensSpent(currentRate);
  };

  useEffect(() => {
    if (!isCalling || !username) return;

    const handleBeforeUnload = () => {
      fetch('/api/call/signal', {
        method: 'POST',
        keepalive: true,
        body: JSON.stringify({ action: 'end', from: uid, to: username })
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCalling, username, uid]);

  const handleTimeUpdate = async (seconds: number) => {
    const currentMinute = Math.floor(seconds / 60);
    const currentRate = callType === 'video' ? videoRate : audioRate;
    const isRoom = activeChannelName?.startsWith('room-');

    if (currentMinute > lastDeductMinuteRef.current) {
      lastDeductMinuteRef.current = currentMinute;

      // Only deduct if it's NOT a free room
      if (!(isRoom && isRoomFree)) {
        const success = await deductBalance(currentRate);
        if (success) {
          setTokensSpent(prev => prev + currentRate);
        }
      }
    }
    setCallDuration(seconds);
  };

  // --- Incoming Call Support for Owner ---
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    if (!isOwner || isCalling) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/call/signal?username=${username}`);
        const data = await res.json();
        if (data.incoming) {
          setIncomingCall(data.incoming);
        } else {
          setIncomingCall(null);
        }
      } catch (e) { }
    }, 3000);
    return () => clearInterval(interval);
  }, [isOwner, isCalling, username]);

  useEffect(() => {
    if (incomingCall && !isCalling) {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const playChime = () => {
        const now = ctx.currentTime;
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gn = ctx.createGain();
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gn.gain.setValueAtTime(0, now + i * 0.12);
          gn.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.05);
          gn.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
          osc.connect(gn);
          gn.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.5);
        });
      };

      playChime();
      const loop = setInterval(playChime, 2000);
      return () => {
        clearInterval(loop);
        ctx.close();
      };
    }
  }, [incomingCall, isCalling]);

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

    try {
      await fetch('/api/call/signal', {
        method: 'POST',
        body: JSON.stringify({ action: 'end', from: uid, to: username })
      });
    } catch (e) { console.error(e); }
  };

  const deductBalance = async (amount: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        body: JSON.stringify({ action: 'deduct', amount, recipientEmail: ownerEmail })
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
      alert("Booking failed. Please try again.");
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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-neo-pink selection:text-white pb-20">
      {/* ERROR TOAST */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-red-500 text-white font-black border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] uppercase text-sm"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b-4 border-black dark:border-white py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_theme(colors.neo-pink)] transition-transform group-hover:rotate-12">
              <Zap className="text-neo-yellow w-5 h-5 fill-neo-yellow" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter">Supertime</span>
          </a>

          <div className="flex items-center gap-4">
            <ThemeToggle className="relative" />
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

      {/* INCOMING CALL MODAL (NEO) */}
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
              className="bg-white border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] p-12 max-w-sm w-full text-center"
            >
              <div className="w-24 h-24 bg-neo-pink border-4 border-black mx-auto mb-6 flex items-center justify-center text-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                👤
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">{incomingCall.from || 'Guest'}</h2>
              <p className="text-xs font-black uppercase tracking-[0.2em] mb-12 text-zinc-400">Incoming {incomingCall.type} call</p>

              <div className="flex gap-4">
                <button
                  onClick={handleRejectCall}
                  className="flex-1 neo-btn bg-red-500 text-white py-4"
                >
                  DECADENCE
                </button>
                <button
                  onClick={() => handleAcceptCall(incomingCall.type)}
                  className="flex-1 neo-btn bg-neo-green text-black py-4 animate-bounce"
                >
                  ACCEPT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE CALL OVERLAY */}
      {isCalling && activeChannelName && (
        <div className="fixed inset-0 z-[300] bg-black">
          <div className="absolute top-24 left-6 z-[310] flex flex-col gap-2">
            <div className="bg-neo-yellow border-4 border-black p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase mb-1">Live Connection</p>
              <p className="text-lg font-black tabular-nums">{formatTime(callDuration)}</p>
            </div>
            <div className="bg-neo-pink border-4 border-black p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
              <p className="text-[10px] font-black uppercase mb-1 text-white/80">Energy Exchange</p>
              <p className="text-lg font-black tabular-nums">{tokensSpent} TKN</p>
            </div>
          </div>

          <AgoraCall
            channelName={activeChannelName}
            type={callType!}
            onDisconnect={handleEndCall}
          />
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 pt-32">
        <div className="grid lg:grid-cols-12 gap-12">

          {/* LEFT COLUMN: Profile info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="relative inline-block">
              <div className="w-48 h-48 bg-white border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt={username} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt={username} className="w-full h-full object-cover" />
                )}
              </div>
              {isCreatorOnline && (
                <div className="absolute -top-4 -right-4 bg-neo-green border-4 border-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-xs animate-bounce">
                  Live Now
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-7xl font-black uppercase leading-[0.8] tracking-tighter flex items-center gap-4 flex-wrap">
                {username}
                {isVerified && <Zap className="w-12 h-12 text-neo-blue fill-neo-blue" />}
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
              </div>
            </div>

            {isOwner ? (
              <div className="bg-neo-blue/10 border-4 border-black border-dashed p-8 space-y-4">
                <h3 className="text-xl font-black uppercase">Your Creator Profile</h3>
                <p className="font-bold text-zinc-600 uppercase text-xs tracking-widest leading-relaxed">
                  This is how your audience sees you. Share your link to start receiving energy exchanges.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); showError("URL Copied!"); }}
                    className="neo-btn bg-black text-white px-6 py-3"
                  >
                    Copy Profile Link
                  </button>
                  <button
                    onClick={() => window.location.href = '/studio'}
                    className="neo-btn bg-neo-green text-black px-6 py-3"
                  >
                    Go to Your Studio
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {isLive && (
                  <button
                    onClick={handleJoinRoom}
                    className="w-full neo-btn bg-neo-green text-black py-8 flex flex-col items-center gap-3 border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all relative overflow-hidden group mb-6"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 rotate-45 translate-x-12 translate-y-[-12px]" />
                    <div className="flex items-center gap-4 relative z-10 w-full px-6">
                      <div className="w-16 h-16 bg-white flex items-center justify-center border-4 border-black rounded-full text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Mic className={`w-8 h-8 ${roomType === 'video' ? 'text-neo-pink' : 'text-neo-blue'}`} />
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black italic tracking-tighter uppercase">Join Studio Space</span>
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                          {roomType} ROOM • {isRoomFree ? 'FREE ACCESS' : 'PAID ENTRY'}
                        </p>
                      </div>
                      <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleStartCall('video')}
                    className="neo-btn bg-neo-pink text-white py-8 flex flex-col items-center gap-3 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="w-12 h-12 bg-white flex items-center justify-center border-4 border-black rounded-full text-black">
                      <Zap className="w-8 h-8 fill-neo-pink text-neo-pink" />
                    </div>
                    <span className="text-2xl font-black">VIDEO</span>
                    <span className="text-xs font-bold opacity-80">{videoRate} TKN/MIN</span>
                  </button>

                  <button
                    onClick={() => handleStartCall('audio')}
                    className="neo-btn bg-neo-blue text-white py-8 flex flex-col items-center gap-3 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="w-12 h-12 bg-white flex items-center justify-center border-4 border-black rounded-full text-black">
                      <Zap className="w-8 h-8 fill-neo-blue text-neo-blue" />
                    </div>
                    <span className="text-2xl font-black">AUDIO</span>
                    <span className="text-xs font-bold opacity-80">{audioRate} TKN/MIN</span>
                  </button>
                </div>

                <div className="bg-neo-yellow border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-black uppercase">Schedule</h3>
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          loginWithGoogle(window.location.pathname);
                          return;
                        }
                        setShowBookingModal(true);
                      }}
                      className="bg-black text-white text-[10px] font-black uppercase px-3 py-1 border-2 border-black hover:bg-zinc-800 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                  <p className="text-xs font-bold text-black/60 uppercase tracking-widest leading-relaxed">Dedicated moments for connection</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-7 space-y-12">
            {templates && templates.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Energy Packages</h3>
                  <div className="h-2 flex-1 bg-black" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {templates.map((tpl: any) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleStartCall(tpl.type)}
                      className="group neo-box bg-white p-6 text-left hover:scale-[1.02] transition-transform flex flex-col justify-between min-h-[180px]"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-3 py-1 border-2 border-black font-black uppercase text-[10px] ${tpl.type === 'video' ? 'bg-neo-pink text-white' : 'bg-neo-blue text-white'}`}>
                            {tpl.type}
                          </span>
                          <span className="font-black text-lg underline decoration-neo-green decoration-4 underline-offset-4">
                            {tpl.price} TKN
                          </span>
                        </div>
                        <h4 className="text-2xl font-black uppercase mb-2 group-hover:text-neo-pink transition-colors">{tpl.duration} Min Session</h4>
                        <p className="text-sm font-bold text-zinc-500 uppercase leading-relaxed">{tpl.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {artifacts && artifacts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Highlights</h3>
                  <div className="h-2 flex-1 bg-black" />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {artifacts.map((art: any) => (
                    <div key={art.id} className="neo-box bg-white overflow-hidden group">
                      <div className="relative aspect-video bg-zinc-100 border-b-4 border-black">
                        <video
                          src={art.url}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                          muted
                          loop
                        />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                          <span className="font-black uppercase text-[10px] text-white tracking-widest">{new Date(art.timestamp).toLocaleDateString()}</span>
                          <button
                            onClick={() => window.open(art.url, '_blank')}
                            className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                          >
                            <Zap className="w-5 h-5 text-neo-pink fill-neo-pink" />
                          </button>
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

      {/* BOOKING MODAL */}
      <AnimatePresence>
        {showBookingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full"
            >
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Book Session</h2>
                <button onClick={() => setShowBookingModal(false)} className="w-8 h-8 border-2 border-black flex items-center justify-center font-black hover:bg-red-500 hover:text-white transition-colors">✕</button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest block">Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-zinc-50 border-4 border-black p-3 font-bold text-sm outline-none focus:bg-neo-yellow/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest block">Time</label>
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-zinc-50 border-4 border-black p-3 font-bold text-sm outline-none focus:bg-neo-yellow/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block">Select Package</label>
                  <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {templates.map((tpl: any) => (
                      <button
                        key={tpl.id}
                        onClick={() => setBookingTemplate(tpl)}
                        className={`w-full text-left p-3 border-4 border-black font-bold text-xs flex justify-between items-center transition-all ${bookingTemplate?.id === tpl.id ? 'bg-neo-yellow shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'}`}
                      >
                        <span>{tpl.duration} Min {tpl.type}</span>
                        <span className="font-black">{tpl.price} TKN</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 font-black uppercase text-xs py-4 hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookCall}
                  disabled={isBooking || !bookingDate || !bookingTime || !bookingTemplate}
                  className="flex-1 neo-btn bg-neo-green text-black py-4 disabled:opacity-50"
                >
                  {isBooking ? 'Processing...' : 'Reserve Moment'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Bottom Footer */}
      <footer className="mt-20 py-12 border-t-4 border-black bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-6 opacity-30">
            <Zap className="w-5 h-5 fill-black" />
            <span className="font-black uppercase text-xs tracking-tighter">Supertime Legacy Engine</span>
          </div>
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em]">Powered by Pure Blissful Art</p>
        </div>
      </footer>
    </div>
  );
}
