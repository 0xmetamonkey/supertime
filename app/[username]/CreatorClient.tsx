'use client';

import React, { useState, useEffect, useRef } from 'react';
import WalletManager from '../components/WalletManager';
import AgoraCall from '../components/AgoraCall';
import { logout, loginWithGoogle } from '../actions';

export default function CreatorClient({
  username,
  user,
  isOwner,
  ownerEmail,
  isVerified,
  socials,
  videoRate = 100,
  audioRate = 50,
  profileImage = ""
}: {
  username: string,
  user: any,
  isOwner: boolean,
  ownerEmail: string,
  isVerified?: boolean,
  socials?: any,
  videoRate?: number,
  audioRate?: number,
  profileImage?: string
}) {

  const [guestId] = useState(() => Math.random().toString(36).slice(2, 7));
  const uid = user?.id || `guest-${guestId}`;
  const isLoggedIn = !!user;

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
          <AgoraCall
            channelName={`channel-${username}`}
            uid={uid}
            callType={callType}
            onEndCall={handleEndCall}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen relative z-10 px-4 text-center pt-16">

          {/* PROFILE CARD */}
          <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-pink-500 mb-5 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
            <div className="w-full h-full rounded-full bg-zinc-900 border-4 border-black overflow-hidden relative">
              <img
                src={profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
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
          {socials && Object.values(socials).some(v => !!v) && (
            <div className="flex items-center justify-center gap-4 mb-8">
              {socials.instagram && (
                <a href={socials.instagram.startsWith('http') ? socials.instagram : `https://instagram.com/${socials.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-800 text-white hover:bg-[#E1306C] transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 3.8 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" /></svg>
                </a>
              )}
              {socials.twitter && (
                <a href={socials.twitter.startsWith('http') ? socials.twitter : `https://twitter.com/${socials.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-800 text-white hover:bg-[#1DA1F2] transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" /></svg>
                </a>
              )}
              {socials.youtube && (
                <a href={socials.youtube.startsWith('http') ? socials.youtube : `https://youtube.com/${socials.youtube}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-800 text-white hover:bg-[#FF0000] transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22,12.06c0,2.16-0.12,4.31-0.34,6.46C21.49,19.98,20.44,21,19,21.17C17.06,21.39,12,21.39,12,21.39s-5.06,0-7-0.22 c-1.44-0.17-2.49-1.19-2.66-2.65C2.12,16.37,2,14.22,2,12.06s0.12-4.31,0.34-6.46C2.51,4.12,3.56,3.1,5,2.93C6.94,2.71,12,2.71,12,2.71 s5.06,0,7,0.22c1.44,0.17,2.49,1.19,2.66,2.65C21.88,7.75,22,9.9,22,12.06z M10,15.5l6-3.5l-6-3.5V15.5z" /></svg>
                </a>
              )}
              {socials.website && (
                <a href={socials.website.startsWith('http') ? socials.website : `https://${socials.website}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-800 text-white hover:bg-green-500 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                </a>
              )}
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
                      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
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
