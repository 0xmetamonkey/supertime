'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

  if (isCalling) {
    return (
      <AgoraCall
        channelName={username}
        uid={uid}
        callType={callType}
        onEndCall={handleEndCall}
        onTimeUpdate={handleTimeUpdate}
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
              {socials && Object.entries(socials).map(([platform, link]) => {
                if (!link) return null;
                return (
                  <a
                    key={platform}
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
