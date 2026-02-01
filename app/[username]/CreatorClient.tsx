'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  isLive = false,
  templates = [],
  availability = {}
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

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!isLoggedIn) {
      // Redirect to login, then come back to THIS profile page
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

    // Send Signal to creator and GET THE CHANNEL NAME
    let callChannelName: string | null = null;
    try {
      const response = await fetch('/api/call/signal', {
        method: 'POST',
        body: JSON.stringify({ action: 'call', from: uid, to: username, type })
      });
      const data = await response.json();
      console.log('[CreatorClient] Signal response:', data);

      if (data.success && data.channelName) {
        console.log('[CreatorClient] Using channel:', data.channelName);
        callChannelName = data.channelName;
        setActiveChannelName(data.channelName);
      } else {
        showError("Failed to connect. Please try again.");
        return;
      }
    } catch (e) {
      console.error(e);
      showError("Connection error. Please try again.");
      return;
    }

    // Enter Call Mode
    setCallType(type);
    setIsCalling(true);
    setCallDuration(0);
    setTokensSpent(0);
    lastDeductMinuteRef.current = 0;

    // Deduct first minute immediately
    await deductBalance(currentRate);
    setTokensSpent(currentRate);
  };

  // Poll for Rejection (DISABLED DEBUGGING)
  /*
  useEffect(() => {
    if (!isCalling) return;
  
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/call/signal?username=${username}`);
        const data = await res.json();
        // If we see explicit rejection or signal is gone (and we assume rejection if not joined? No, let's treat "rejected: true" as definitive)
        if (data.rejected) {
          showError("Call Declined");
          handleEndCall();
        }
      } catch (e) { }
    }, 2000);
    return () => clearInterval(interval);
  }, [isCalling, username]);
  */

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

    if (currentMinute > lastDeductMinuteRef.current) {
      lastDeductMinuteRef.current = currentMinute;
      const success = await deductBalance(currentRate);
      if (success) {
        setTokensSpent(prev => prev + currentRate);
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
        alert("Not enough tokens! Please add more tokens.");
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

  // Admire State
  const [admirerCount, setAdmirerCount] = useState(0);
  const [isAdmiring, setIsAdmiring] = useState(false);

  useEffect(() => {
    // Fetch Admire Data
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

  const { theme } = useTheme();

  // --------------------------------------------------------------------------
  // SLICK THEME
  // --------------------------------------------------------------------------
  if (theme === 'slick') {
    return (
      <main className="min-h-screen bg-black text-white font-sans overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-900/40 blur-[130px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-900/20 blur-[100px] rounded-full animate-pulse [animation-delay:2s]" />
          <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-pink-900/10 blur-[90px] rounded-full" />
        </div>

        {/* NAV */}
        <nav className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <a href="/" className="text-sm font-bold bg-white/10 backdrop-blur px-3 py-1 rounded-full text-white hover:bg-white/20 transition-colors">supertime</a>
          </div>
          <div className="pointer-events-auto flex items-center gap-3">
            {isOwner && (
              <button
                onClick={() => window.location.href = '/studio'}
                className="bg-green-500 px-4 py-1.5 rounded-full text-black font-bold text-xs hover:scale-105 transition-transform"
              >
                Go to Studio →
              </button>
            )}
            {isLoggedIn ? (
              <WalletManager onBalanceChange={setBalance} />
            ) : (
              <button
                onClick={() => loginWithGoogle(window.location.pathname)}
                className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
              >
                Sign In to Call
              </button>
            )}
          </div>
        </nav>

        {/* ERROR TOAST */}
        {errorMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-red-600 text-white font-bold rounded-full shadow-2xl animate-bounce">
            {errorMsg}
          </div>
        )}

        {/* INCOMING CALL (RINGING) */}
        {incomingCall && !isCalling && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-3xl flex flex-col items-center justify-between p-12 text-center animate-in fade-in duration-500">
            <div className="mt-20">
              <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 p-1 mb-6 mx-auto">
                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-4xl">👤</div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-2 text-white">{incomingCall.from || 'Guest'}</h2>
              <p className="text-[#CEFF1A] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
                Incoming {incomingCall.type} call
              </p>
            </div>
            <div className="w-full max-w-[280px] flex justify-between items-center mb-16">
              <div className="flex flex-col items-center gap-4">
                <button onClick={handleRejectCall} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl active:scale-90 transition-transform">
                  <span className="text-2xl text-white">📞</span>
                </button>
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <button onClick={() => handleAcceptCall(incomingCall.type)} className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-2xl active:scale-90 transition-transform animate-bounce">
                  <span className="text-2xl text-white">📞</span>
                </button>
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Accept</span>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        {isCalling ? (
          <div className="relative w-full h-full min-h-screen">
            {/* Live Billing Info */}
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] bg-black/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-zinc-700 flex items-center gap-6">
              <div className="text-center">
                <span className="text-xs text-zinc-400 block">Duration</span>
                <span className="font-mono font-bold text-xl text-white">{formatTime(callDuration)}</span>
              </div>
              <div className="w-px h-10 bg-zinc-700" />
              <div className="text-center">
                <span className="text-xs text-zinc-400 block">Spent</span>
                <span className="font-mono font-bold text-xl text-purple-400">{tokensSpent} TKN</span>
              </div>
              <div className="w-px h-10 bg-zinc-700" />
              <div className="text-center">
                <span className="text-xs text-zinc-400 block">Balance</span>
                <span className="font-mono font-bold text-xl text-green-400">{balance} TKN</span>
              </div>
            </div>

            <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col items-center justify-center">
              <AgoraCall
                channelName={activeChannelName || `supertime-${username}`}
                type={callType}
                onDisconnect={handleEndCall}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen relative z-10 px-4 text-center pt-16">

            {/* PROFILE CARD */}
            <div className="group relative w-32 h-32 mb-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-[#CEFF1A] rounded-full blur-xl opacity-40 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
              <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-tr from-purple-500 to-pink-500 shadow-[0_0_50px_rgba(168,85,247,0.5)]">
                <div className="w-full h-full rounded-full bg-zinc-900 border-[6px] border-black overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt="Profile" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
              {isCreatorOnline && (
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#CEFF1A] rounded-full border-4 border-black animate-bounce shadow-[0_0_15px_#CEFF1A]" />
              )}
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight mb-1 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent capitalize flex items-center justify-center gap-2">
              {username}
              {isVerified && (
                <svg className="w-6 h-6 text-blue-500 fill-current" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fillOpacity="0.3" />
                  {/* Custom Blue Badge Style */}
                  <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                </svg>
              )}
            </h1>
            <p className="text-zinc-500 text-sm mb-6">
              Video & Audio calls available
            </p>

            {/* ADMIRE BUTTON */}
            <button
              onClick={isOwner ? undefined : toggleAdmire}
              disabled={isOwner}
              className={`flex items-center gap-2 px-4 py-2 rounded-full mb-6 transition-all ${isAdmiring
                ? 'bg-pink-500/20 text-pink-500 border border-pink-500/50'
                : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white'
                } ${isOwner ? 'opacity-50 cursor-default' : ''}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isAdmiring ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="font-bold text-sm">
                {admirerCount} {admirerCount === 1 ? 'Admirer' : 'Admirers'}
              </span>
            </button>

            {/* Social Links */}
            {socials && Object.values(socials).some((v: any) => !!v) && (
              <div className="flex items-center justify-center gap-4 mb-8">
                {Object.entries(socials).map(([key, val]) => {
                  if (!val || typeof val !== 'string') return null;
                  const platform = key === 'twitter' ? 'x' : key;

                  // Ensure HTTPS
                  let href = val;
                  if (!href.startsWith('http')) {
                    href = href.includes('.') ? `https://${href}` : `https://${platform}.com/${href.replace('@', '')}`;
                  }

                  return (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-800 text-white hover:bg-white/20 transition-colors">
                      <img src={`https://simpleicons.org/icons/${platform}.svg`} className="w-4 h-4 invert opacity-70" alt={platform} />
                    </a>
                  )
                })}
              </div>
            )}

            {/* Call Templates (Slick) */}
            {templates && templates.length > 0 && (
              <div className="w-full max-w-sm mb-6 space-y-3">
                <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center mb-2">Pre-configured Sessions</h3>
                {templates.map((tpl: any) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleStartCall(tpl.type)}
                    className="w-full group bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:border-purple-500 transition-all flex justify-between items-center text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold">{tpl.duration} MIN {tpl.type.toUpperCase()}</span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">⚡ {tpl.price} TKN</span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1">{tpl.description}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      →
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* CALL BUTTONS or OWNER MESSAGE */}
            <div className="w-full max-w-sm space-y-3">
              {isOwner ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
                  <p className="text-zinc-400 mb-4">This is your profile. Share this link with your audience!</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://supertime.wtf/${username}`);
                      showError("Link copied!");
                    }}
                    className="w-full py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors mb-3"
                  >
                    📋 Copy Link
                  </button>
                  <button
                    onClick={() => window.location.href = '/studio'}
                    className="w-full py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-colors"
                  >
                    🎙️ Go Live in Studio
                  </button>
                  <div className="flex justify-center pt-2">
                    <ThemeToggle />
                  </div>
                </div>
              ) : (
                <>
                  {/* Scheduling Section (Slick) */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 mb-3">
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          loginWithGoogle(window.location.pathname);
                          return;
                        }
                        setShowBookingModal(true);
                      }}
                      className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                    >
                      📅 Schedule a Session
                    </button>
                    <p className="text-[10px] text-zinc-500 mt-2 text-center uppercase tracking-wider">Book a dedicated time slot</p>
                  </div>

                  {showBookingModal && (
                    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full animate-in zoom-in duration-300">
                        <h2 className="text-xl font-bold mb-4">Book a Call</h2>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Select Date</label>
                            <input
                              type="date"
                              value={bookingDate}
                              onChange={(e) => setBookingDate(e.target.value)}
                              className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Select Time</label>
                            <input
                              type="time"
                              value={bookingTime}
                              onChange={(e) => setBookingTime(e.target.value)}
                              className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Select Session</label>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {templates.map((tpl: any) => (
                                <button
                                  key={tpl.id}
                                  onClick={() => setBookingTemplate(tpl)}
                                  className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${bookingTemplate?.id === tpl.id ? 'border-[#CEFF1A] bg-[#CEFF1A]/10' : 'border-zinc-800 bg-black'}`}
                                >
                                  {tpl.duration} min {tpl.type} - {tpl.price} TKN
                                </button>
                              ))}
                              {templates.length === 0 && <p className="text-[10px] text-zinc-600 italic">No session templates available.</p>}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                          <button onClick={() => setShowBookingModal(false)} className="flex-1 py-3 text-zinc-500 font-bold">Cancel</button>
                          <button
                            onClick={handleBookCall}
                            disabled={isBooking}
                            className="flex-1 py-3 bg-[#CEFF1A] text-black font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                          >
                            {isBooking ? 'Booking...' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Not logged in - show login prompt */}
                  {!isLoggedIn && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-4">
                      <p className="text-zinc-400 text-sm mb-4">Sign in to add tokens and start a call</p>
                      <button
                        onClick={() => loginWithGoogle(window.location.pathname)}
                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                      >
                        Continue with Google
                      </button>
                    </div>
                  )}

                  {/* Logged in - show call options */}
                  {isLoggedIn && (
                    <>
                      <button
                        onClick={() => handleStartCall('video')}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-500 hover:to-pink-500 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-center gap-3"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                        <span className="text-lg">Video Call</span>
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded font-mono">{videoRate} TKN/min</span>
                      </button>
                      <button
                        onClick={() => handleStartCall('audio')}
                        className="w-full py-3 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                        <span>Audio Only</span>
                        <span className="bg-black/50 text-zinc-300 text-xs px-2 py-1 rounded font-mono">{audioRate} TKN/min</span>
                      </button>

                      {balance < audioRate && (
                        <p className="text-amber-400 text-xs text-center mt-2">
                          ⚡ Add tokens using the wallet button above to start a call
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-black text-white p-4 font-mono flex flex-col items-center">
      {isCalling && activeChannelName && callType && (
        <div className="fixed inset-0 z-50 bg-black animate-in fade-in duration-300">
          <AgoraCall
            channelName={activeChannelName}
            type={callType}
            onDisconnect={handleEndCall}
          />
        </div>
      )}
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      {/* INCOMING CALL (RINGING) */}
      {incomingCall && !isCalling && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-3xl flex flex-col items-center justify-between p-12 text-center animate-in fade-in duration-500 font-sans">
          <div className="mt-20">
            <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 p-1 mb-6 mx-auto">
              <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-4xl">👤</div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-white">{incomingCall.from || 'Guest'}</h2>
            <p className="text-[#CEFF1A] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
              Incoming {incomingCall.type} call
            </p>
          </div>
          <div className="w-full max-w-[280px] flex justify-between items-center mb-16">
            <div className="flex flex-col items-center gap-4">
              <button onClick={handleRejectCall} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl active:scale-90 transition-transform">
                <span className="text-2xl text-white">📞</span>
              </button>
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <button onClick={() => handleAcceptCall(incomingCall.type)} className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-2xl active:scale-90 transition-transform animate-bounce">
                <span className="text-2xl text-white">📞</span>
              </button>
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Accept</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Nav */}
      <nav className="w-full max-w-md flex justify-between items-center z-10 mb-8 pt-4">
        <button onClick={() => router.push('/')} className="text-white font-black uppercase text-xl tracking-tighter hover:text-[#CEFF1A] transition-colors">
          SuperTime
        </button>
        {isOwner ? (
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => router.push('/studio')}
              className="bg-white text-black font-bold px-4 py-2 text-xs border-2 border-black hover:bg-[#CEFF1A] uppercase shadow-[4px_4px_0px_0px_#333]"
            >
              Go to Studio
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (isCreatorOnline) {
                navigator.clipboard.writeText(window.location.href);
                // Simple Alert for copy feedback in this brutalist style
                alert("LINK COPIED TO CLIPBOARD");
              }
            }}
            className="text-zinc-500 font-bold text-xs uppercase hover:text-white bracket-btn"
          >
            [ Share ]
          </button>
        )}
      </nav>

      {/* Profile Card (ID Badge Style) */}
      <div className="w-full max-w-md z-10 relative">
        <div className="bg-zinc-900 border-4 border-white shadow-[8px_8px_0px_0px_#CEFF1A] mb-8">
          {/* Header Bar */}
          <div className="bg-white text-black p-2 flex justify-between items-center border-b-4 border-white">
            <span className="font-black text-xs uppercase tracking-widest">Creator ID: {username}</span>
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-black rounded-full" />
              <div className="w-3 h-3 bg-black rounded-full" />
            </div>
          </div>

          <div className="p-6 flex flex-col items-center text-center">
            {/* Profile Photo */}
            <div className="w-36 h-36 border-4 border-white mb-6 relative overflow-hidden bg-zinc-800 shadow-[8px_8px_0px_0px_#333] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_#CEFF1A] transition-all duration-300">
              {profileImage ? (
                <img src={profileImage} alt={username} className="w-full h-full object-cover grayscale contrast-150 hover:grayscale-0 transition-all duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-black text-zinc-700 bg-[url('/noise.png')]">
                  ?
                </div>
              )}
              {/* Online Indicator */}
              <div className={`absolute top-0 right-0 px-3 py-1 text-[12px] font-black border-l-4 border-b-4 border-white uppercase z-10 ${isCreatorOnline ? 'bg-[#CEFF1A] text-black animate-pulse' : 'bg-red-600 text-white'}`}>
                {isCreatorOnline ? 'LIVE' : 'OFFLINE'}
              </div>
            </div>

            {/* Name & Bio */}
            <h1 className="text-3xl font-black uppercase mb-1 tracking-tighter">
              {username} {isVerified && <span className="text-[#CEFF1A] ml-1" title="Verified">✓</span>}
            </h1>
            <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest mb-6">
                // Digital Creator
            </p>

            {/* Social Stats/Link */}
            <div className="flex gap-4 justify-center w-full mb-8 relative">
              {socials && Object.entries(socials).map(([key, link]) => {
                if (!link || typeof link !== 'string') return null;
                const platform = key === 'twitter' ? 'x' : key;

                // Standardized Redirect Logic
                let href = link;
                if (!href.startsWith('http')) {
                  href = href.includes('.') ? `https://${href}` : `https://${platform}.com/${href.replace('@', '')}`;
                }

                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black border border-zinc-700 p-2 text-zinc-400 hover:text-white hover:border-[#CEFF1A] transition-colors"
                  >
                    <img
                      src={`https://simpleicons.org/icons/${platform}.svg`}
                      alt={platform}
                      className="w-4 h-4 invert opacity-75 hover:opacity-100"
                    />
                  </a>
                )
              })}
            </div>

            {/* Call Templates (Brutalist) */}
            {templates && templates.length > 0 && (
              <div className="w-full mb-8 text-left">
                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-3 border-b border-zinc-800 pb-1">Bundled Sessions</label>
                <div className="space-y-3">
                  {templates.map((tpl: any) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleStartCall(tpl.type)}
                      className="w-full bg-black border-2 border-zinc-800 p-3 hover:border-white transition-all text-left group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-black text-white group-hover:text-[#CEFF1A]">{tpl.duration} MINUTE {tpl.type.toUpperCase()}</span>
                        <span className="bg-white text-black text-[10px] font-bold px-2">{tpl.price} TKN</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase grayscale group-hover:grayscale-0">{tpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduling Section (Brutalist) */}
            <div className="w-full mb-4">
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    loginWithGoogle(window.location.pathname);
                    return;
                  }
                  setShowBookingModal(true);
                }}
                className="w-full py-3 bg-black text-white font-black border-2 border-white hover:bg-white hover:text-black transition-all uppercase text-sm shadow-[4px_4px_0px_0px_#CEFF1A]"
              >
                [ Schedule Session ]
              </button>
            </div>

            {/* Call Actions */}
            <div className="w-full grid gap-4">
              <button
                onClick={() => handleStartCall('video')}
                className="group relative w-full bg-[#CEFF1A] text-black font-black text-xl py-4 border-2 border-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[6px_6px_0px_0px_#fff] transition-all uppercase flex items-center justify-between px-6"
              >
                <span>Video Call</span>
                <span className="text-sm font-mono border-2 border-black px-2 py-1 bg-white group-hover:bg-black group-hover:text-[#CEFF1A] transition-colors">
                  {videoRate} TKN/min
                </span>
              </button>

              <button
                onClick={() => handleStartCall('audio')}
                className="group relative w-full bg-black text-white font-black text-xl py-4 border-2 border-zinc-700 hover:border-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[6px_6px_0px_0px_#333] transition-all uppercase flex items-center justify-between px-6"
              >
                <span>Audio Call</span>
                <span className="text-sm font-mono border border-zinc-700 px-2 py-1 text-zinc-400 group-hover:text-white group-hover:border-white transition-colors">
                  {audioRate} TKN/min
                </span>
              </button>
            </div>

            {/* Wallet / Balance Info for Caller */}
            {isLoggedIn && !isOwner && (
              <div className="mt-8 pt-6 border-t font-mono text-xs w-full grid grid-cols-2 gap-4 border-zinc-800">
                <div className="text-left">
                  <span className="text-zinc-500 block mb-1">YOUR BALANCE</span>
                  <span className="text-white font-bold">{balance} TKN</span>
                </div>
                <div className="text-right">
                  <WalletManager onBalanceChange={setBalance} />
                </div>
              </div>
            )}

            {/* Login Prompt if not logged in */}
            {!isLoggedIn && (
              <div className="mt-8 pt-6 border-t border-zinc-800 w-full">
                <button onClick={() => loginWithGoogle(window.location.pathname)} className="text-zinc-500 text-xs hover:text-white underline uppercase">
                  Login to call
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center font-mono text-[10px] text-zinc-600 uppercase">
          <p>Powered by SuperTime</p>
          <p>Secure • Encrypted • Instant</p>
        </div>
      </div>
    </main>
  );
}
