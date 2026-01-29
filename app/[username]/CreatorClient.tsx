'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WalletManager from '../components/WalletManager';
import AgoraCall from '../components/AgoraCall';
import DailyCall from '../components/DailyCall';
import { useSession } from 'next-auth/react';
import { useTheme } from '../context/ThemeContext';
import { logout, loginWithGoogle } from '../actions';

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
  callingProvider?: 'agora' | 'daily';
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
  callingProvider = 'agora'
}: CreatorClientProps) {

  const [guestId] = useState(() => Math.random().toString(36).slice(2, 7));
  const uid = user?.id || `guest-${guestId}`;
  const isLoggedIn = !!user;
  const router = useRouter();

  // State
  const [balance, setBalance] = useState<number>(0);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [errorMsg, setErrorMsg] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [tokensSpent, setTokensSpent] = useState(0);
  const [isCreatorOnline, setIsCreatorOnline] = useState(true);

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

    // Send Signal to creator
    try {
      await fetch('/api/call/signal', {
        method: 'POST',
        body: JSON.stringify({ action: 'call', from: uid, to: username, type })
      });
    } catch (e) { console.error(e); }

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

  const handleEndCall = async () => {
    setIsCalling(false);
    setCallDuration(0);
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
          <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-purple-900/40 blur-[120px] rounded-full" />
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

        {/* MAIN CONTENT */}
        {isCalling ? (
          <div className="relative w-full h-full min-h-screen">
            {/* Live Billing Info */}
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] bg-black/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-zinc-700 flex items-center gap-6">
              <div className="text-center">
                <span className="text-zinc-500 font-bold uppercase tracking-tighter text-[9px] block">LIVE DURATION</span>
                <span className="font-mono font-bold text-xl text-white">{formatTime(callDuration)}</span>
              </div>
              <div className="w-px h-10 bg-zinc-700" />
              <div className="text-center">
                <span className="text-purple-500 font-bold uppercase tracking-tighter text-[9px] block">LIVE SPENT</span>
                <span className="font-mono font-bold text-xl text-purple-400">{tokensSpent} TKN</span>
              </div>
              <div className="w-px h-10 bg-zinc-700" />
              <div className="text-center">
                <span className="text-xs text-zinc-400 block">Balance</span>
                <span className="font-mono font-bold text-xl text-green-400">{balance} TKN</span>
              </div>
            </div>

            {callingProvider === 'agora' ? (
              <AgoraCall
                channelName={`channel-${username}`}
                uid={uid}
                remoteName={username}
                callType={callType}
                onEndCall={handleEndCall}
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <DailyCall
                channelName={`channel-${username}`}
                remoteName={username}
                onEndCall={handleEndCall}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen relative z-10 px-4 text-center pt-16">

            {/* PROFILE CARD */}
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-pink-500 mb-5 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full rounded-full bg-zinc-900 border-4 border-black overflow-hidden relative">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt="Profile" className="w-full h-full object-cover" />
                )}
              </div>
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
                  if (!val) return null;
                  const platform = key === 'twitter' ? 'x' : key;
                  return (
                    <a key={key} href={val as string} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-800 text-white hover:bg-white/20 transition-colors">
                      <img src={`https://simpleicons.org/icons/${platform}.svg`} className="w-4 h-4 invert opacity-70" alt={platform} />
                    </a>
                  )
                })}
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
                </div>
              ) : (
                <>
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
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded font-mono">{videoRate}/min</span>
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
                        <span className="bg-black/50 text-zinc-300 text-xs px-2 py-1 rounded font-mono">{audioRate}/min</span>
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

  // --------------------------------------------------------------------------
  // NEO THEME (Default)
  // --------------------------------------------------------------------------
  if (isCalling) {
    return callingProvider === 'agora' ? (
      <AgoraCall
        channelName={`channel-${username || 'fallback'}`}
        uid={uid || `guest-${guestId}`}
        remoteName={username}
        callType={callType}
        onEndCall={handleEndCall}
        onTimeUpdate={handleTimeUpdate}
      />
    ) : (
      <DailyCall
        channelName={`channel-${username || 'fallback'}`}
        remoteName={username}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 font-mono flex flex-col items-center">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      {/* Top Nav */}
      <nav className="w-full max-w-md flex justify-between items-center z-10 mb-8 pt-4">
        <button onClick={() => router.push('/')} className="text-white font-black uppercase text-xl tracking-tighter hover:text-[#CEFF1A] transition-colors">
          SuperTime
        </button>
        {isOwner ? (
          <button
            onClick={() => router.push('/studio')}
            className="bg-white text-black font-bold px-4 py-2 text-xs border-2 border-black hover:bg-[#CEFF1A] uppercase shadow-[4px_4px_0px_0px_#333]"
          >
            Go to Studio
          </button>
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
            <div className="w-32 h-32 border-4 border-white mb-6 relative overflow-hidden bg-zinc-800 shadow-[4px_4px_0px_0px_#333]">
              {profileImage ? (
                <img src={profileImage} alt={username} className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-zinc-700 bg-[url('/noise.png')]">
                  ?
                </div>
              )}
              {/* Online Indicator */}
              <div className={`absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-bold border-2 border-black uppercase ${isCreatorOnline ? 'bg-[#CEFF1A] text-black' : 'bg-red-500 text-white'}`}>
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
                if (!link) return null;
                const platform = key === 'twitter' ? 'x' : key;
                return (
                  <a
                    key={key}
                    href={link as string}
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

            {/* Call Actions */}
            <div className="w-full grid gap-4">
              <button
                onClick={() => handleStartCall('video')}
                className="group relative w-full bg-[#CEFF1A] text-black font-black text-xl py-4 border-2 border-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[6px_6px_0px_0px_#fff] transition-all uppercase flex items-center justify-between px-6"
              >
                <span>Video Call</span>
                <span className="text-sm font-mono border-2 border-black px-2 py-1 bg-white group-hover:bg-black group-hover:text-[#CEFF1A] transition-colors">
                  ${videoRate}/min
                </span>
              </button>

              <button
                onClick={() => handleStartCall('audio')}
                className="group relative w-full bg-black text-white font-black text-xl py-4 border-2 border-zinc-700 hover:border-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[6px_6px_0px_0px_#333] transition-all uppercase flex items-center justify-between px-6"
              >
                <span>Audio Call</span>
                <span className="text-sm font-mono border border-zinc-700 px-2 py-1 text-zinc-400 group-hover:text-white group-hover:border-white transition-colors">
                  ${audioRate}/min
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
