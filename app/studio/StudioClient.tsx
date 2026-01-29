'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '../actions';
// Removed DailyCall import
import { useTheme } from '../context/ThemeContext';
import { useSession } from 'next-auth/react';

import WalletManager from '../components/WalletManager';
import { checkAvailability, claimUsername } from '../actions';

export default function StudioClient({ username, session, initialSettings }: { username: string | null, session: any, initialSettings?: any }) {
  const router = useRouter();
  // State
  const [isLive, setIsLive] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string, type: 'audio' | 'video' } | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [requests, setRequests] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [remoteName, setRemoteName] = useState('Guest');
  // Removed callingProvider state

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [pendingVideoRate, setPendingVideoRate] = useState(initialSettings?.videoRate ?? 100);
  const [pendingAudioRate, setPendingAudioRate] = useState(initialSettings?.audioRate ?? 50);
  const [pendingSocials, setPendingSocials] = useState(initialSettings?.socials ?? { instagram: '', x: '', youtube: '', website: '' });
  const [pendingProfileImage, setPendingProfileImage] = useState(initialSettings?.profileImage || '');
  const [isUploading, setIsUploading] = useState(false);
  // Removed pendingCallingProvider state

  const saveSettings = async () => {
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        body: JSON.stringify({
          socials: pendingSocials,
          videoRate: pendingVideoRate,
          audioRate: pendingAudioRate,
          profileImage: pendingProfileImage,
        })
      });
      alert("Settings Saved!");
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
      const response = await fetch(
        `/api/upload?filename=${file.name}`,
        {
          method: 'POST',
          body: file,
        },
      );
      const newBlob = await response.json();
      setPendingProfileImage(newBlob.url);
    } catch (e) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // State for Visitor Mode
  const [claimName, setClaimName] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

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
      console.error("Claim Error:", e);
      setClaimError(e.message || "Something went wrong. Check connection.");
      setClaimLoading(false);
    }
  };

  // Polling for Incoming Calls
  useEffect(() => {
    if (!username || !isLive || isCalling) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/call/signal?username=${username}`);
        const data = await res.json();
        if (data.active) {
          setIncomingCall({ from: data.from || 'Guest', type: data.type || 'video' });
        } else {
          setIncomingCall(null);
        }
      } catch (e) { console.error(e); }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive, isCalling, username]);

  // Audio Notification (Oscillator for reliability)
  useEffect(() => {
    if (incomingCall && !isCalling) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playChime = () => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gn = ctx.createGain();

        // Harmonious chord (E5 and G5)
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc2.frequency.setValueAtTime(783.99, ctx.currentTime);
        osc1.type = 'sine';
        osc2.type = 'sine';

        gn.gain.setValueAtTime(0, ctx.currentTime);
        gn.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
        gn.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        osc1.connect(gn);
        osc2.connect(gn);
        gn.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.6);
        osc2.stop(ctx.currentTime + 1.6);
      };

      playChime();
      const loop = setInterval(playChime, 3000);

      return () => {
        clearInterval(loop);
        ctx.close();
      };
    }
  }, [incomingCall, isCalling]);

  // Polling for Requests (Queue)
  useEffect(() => {
    if (!username) return;
    const fetchRequests = async () => {
      try {
        const res = await fetch(`/api/call/request?username=${username}`);
        const data = await res.json();
        if (data.requests) setRequests(data.requests);
      } catch (e) { }
    };
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [username]);

  const answerCall = async () => {
    if (!incomingCall) return;
    if (!username) {
      alert("Error: You must claim a username before accepting calls.");
      return;
    }
    if (incomingCall?.from) setRemoteName(incomingCall.from);
    await fetch('/api/call/signal', { method: 'POST', body: JSON.stringify({ action: 'answer', from: username }) });
    setCallType(incomingCall.type);
    setIncomingCall(null);
    setIsCalling(true);
    setCallDuration(0);
    setTokensEarned(0);
  };

  const rejectCall = async () => {
    await fetch('/api/call/signal', { method: 'POST', body: JSON.stringify({ action: 'reject', from: username }) });
    setIncomingCall(null);
  };

  // Note: incomingCall parameter was unused in original code but was passed in handleAcceptCall. 
  // Adjusted signature to match usage in template.
  const handleAcceptCall = async (type: 'audio' | 'video') => {
    answerCall();
  }

  const handleRejectCall = () => {
    rejectCall();
  }

  const handleTimeUpdate = (seconds: number) => {
    setCallDuration(seconds);
    const rate = callType === 'video' ? pendingVideoRate : pendingAudioRate;
    const minutes = Math.ceil(seconds / 60);
    setTokensEarned(minutes * rate);
  };

  const handleEndCall = () => {
    setIsCalling(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const { theme } = useTheme();

  // --------------------------------------------------------------------------
  // VISITOR VIEW (No Username)
  // --------------------------------------------------------------------------
  if (!username) {
    return (
      <main className="min-h-screen bg-black text-white p-6 md:p-12 flex flex-col items-center relative overflow-hidden font-mono">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

        <nav className="w-full flex justify-between items-center mb-12 max-w-4xl z-10 border-b-2 border-zinc-800 pb-4">
          <h1 className="text-xl font-black uppercase tracking-tighter italic">
            Super<span className="text-[#CEFF1A]">Time</span> Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <WalletManager onBalanceChange={setBalance} />
            <button
              onClick={() => logout()}
              className="text-red-500 font-bold text-xs uppercase hover:underline"
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="w-full max-w-2xl z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* WALLET & STATUS */}
          <div className="bg-zinc-900 border-2 border-white p-6 shadow-[6px_6px_0px_0px_#fff]">
            <h2 className="text-2xl font-black uppercase mb-2 italic">My Wallet</h2>
            <div className="h-1 w-12 bg-[#CEFF1A] mb-4"></div>
            <p className="text-zinc-400 text-xs mb-6 uppercase tracking-wider font-bold">
              Current Credits: <span className="text-white text-lg ml-2">{balance ?? '...'} TKN</span>
            </p>
            <p className="text-zinc-500 text-[10px] leading-relaxed mb-4">
              Use your credits to call creators. 100% secure payments via Razorpay.
            </p>
            <div className="pt-4 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-500 italic uppercase">Logged in as {session?.user?.email}</p>
            </div>
          </div>

          {/* BECOME A CREATOR */}
          <div className="bg-black border-2 border-[#CEFF1A] p-6 shadow-[6px_6px_0px_0px_#CEFF1A] relative">
            <div className="absolute -top-3 left-4 bg-black border border-[#CEFF1A] px-2 py-0.5 text-[#CEFF1A] text-[10px] font-black uppercase">
              Monetize your time
            </div>
            <h2 className="text-2xl font-black uppercase mb-4 italic">Start Earning</h2>
            <p className="text-zinc-400 text-xs mb-6">
              Claim your unique link and start accepting paid calls today.
            </p>

            <form onSubmit={handleClaim} className="space-y-4">
              <div className="flex items-center bg-zinc-900 border-2 border-zinc-700 p-2 focus-within:border-white transition-all">
                <span className="text-zinc-600 text-[10px] px-2">supertime.wtf/</span>
                <input
                  type="text"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="USERNAME"
                  className="flex-1 bg-transparent border-none outline-none text-white font-bold text-sm placeholder:text-zinc-800 uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={!claimName || claimLoading}
                className="w-full bg-[#CEFF1A] text-black font-black py-3 border-2 border-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none shadow-[3px_3px_0px_0px_#fff] transition-all uppercase text-sm"
              >
                {claimLoading ? 'Processing...' : 'Claim & Setup Studio'}
              </button>
              {claimError && <p className="text-red-500 text-[10px] uppercase font-bold text-center mt-2">{claimError}</p>}
            </form>
          </div>
        </div>

        {/* SYSTEM STATUS (DEBUG) */}
        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl max-w-2xl w-full z-10">
          <p className="text-[10px] text-zinc-500 font-mono uppercase mb-2 animate-pulse">System Diagnostic Info (Beta)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-mono text-zinc-400">
            <div className="bg-black p-2 rounded border border-zinc-800">
              <span className="text-zinc-600 block mb-1">Session Email:</span>
              <span className="text-white truncate block">{session?.user?.email || 'N/A'}</span>
            </div>
            <div className="bg-black p-2 rounded border border-zinc-800">
              <span className="text-zinc-600 block mb-1">Resolved Name:</span>
              <span className="text-white block">{username || 'NULL'}</span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-[10px] text-[#CEFF1A] hover:underline uppercase"
          >
            [ Force Refresh Data ]
          </button>
        </div>

        <div className="mt-16 text-center z-10">
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] mb-4">Exploration</p>
          <button
            onClick={() => router.push('/')}
            className="text-white border-2 border-white px-8 py-2 font-black uppercase hover:bg-white hover:text-black transition-all text-xs"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // CREATOR VIEW (Existing)
  // --------------------------------------------------------------------------
  if (theme === 'slick') {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center relative overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#CEFF1A]/10 blur-[100px] rounded-full" />
        </div>

        <nav className="w-full flex justify-between items-center mb-10 max-w-4xl z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black italic tracking-tighter">STUDIO</h1>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-md font-mono">{username}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = `/${username}`}
              className="bg-zinc-800 text-white font-bold text-xs px-4 py-2 rounded-full hover:bg-zinc-700"
            >
              VIEW PROFILE
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-white text-black font-bold text-xs px-4 py-2 rounded-full hover:bg-zinc-200"
            >
              SETTINGS
            </button>
            <button
              onClick={() => logout()}
              className="text-red-500 font-bold text-sm hover:text-red-400"
            >
              LOG OUT
            </button>
          </div>
        </nav>

        {/* SETTINGS OVERLAY */}
        {showSettings && (
          <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full relative animate-in zoom-in duration-300">
              <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
              <h2 className="text-2xl font-bold mb-6">Studio Settings</h2>

              {/* RATES */}
              <div className="space-y-4 mb-6">
                <h3 className="text-zinc-400 text-sm font-bold uppercase">Rates (TKN/min)</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500 mb-1 block">Video</label>
                    <input type="number" value={pendingVideoRate} onChange={(e) => setPendingVideoRate(Number(e.target.value))} className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white font-bold" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500 mb-1 block">Audio</label>
                    <input type="number" value={pendingAudioRate} onChange={(e) => setPendingAudioRate(Number(e.target.value))} className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white font-bold" />
                  </div>
                </div>
              </div>

              {/* SOCIALS */}
              <div className="space-y-4 mb-8">
                <h3 className="text-zinc-400 text-sm font-bold uppercase">Social Links</h3>
                {['instagram', 'x', 'youtube', 'website'].map((platform) => (
                  <div key={platform} className="flex items-center bg-black border border-zinc-700 rounded-xl px-4 py-3">
                    <span className="text-zinc-600 text-xs uppercase w-20 font-bold">{platform}</span>
                    <input type="text" value={(pendingSocials as any)[platform]} onChange={(e) => setPendingSocials({ ...pendingSocials, [platform]: e.target.value })} className="flex-1 bg-transparent border-none outline-none text-white text-sm" placeholder="URL..." />
                  </div>
                ))}
              </div>

              {/* Calling Engine setting removed */}

              {/* SHARE LINK */}
              <div className="bg-zinc-800 rounded-xl p-4 mb-8 flex justify-between items-center">
                <span className="text-xs text-zinc-400 font-mono">supertime.wtf/{username}</span>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${username}`); alert("Copied!"); }} className="text-xs bg-white text-black font-bold px-3 py-1 rounded-full">Copy</button>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowSettings(false)} className="flex-1 py-3 text-zinc-400 font-bold">Cancel</button>
                <button onClick={saveSettings} className="flex-1 py-3 bg-[#D652FF] text-white font-bold rounded-xl hover:bg-[#b042d1]">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* LIVE SWITCH / MAIN ACTION */}
        <div className="z-10 w-full max-w-md bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-3xl p-8 mb-8 text-center shadow-2xl animate-in zoom-in duration-300">

          {isCalling ? (
            <div className="fixed inset-0 z-[200] bg-black">
              <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[210] bg-green-500/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-green-500/50 flex items-center gap-4">
                <span className="text-green-400 font-bold uppercase tracking-tighter text-[10px]">💰 Earning</span>
                <span className="font-mono font-bold text-xl text-white">+{tokensEarned} TKN</span>
              </div>
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 font-mono text-xs uppercase tracking-widest p-12">
                <span className="block text-4xl mb-4">🚧</span>
                <p>Call Service Unavailable</p>
                <p className="text-[10px] mt-2 opacity-50">Please check back later.</p>
                <button onClick={handleEndCall} className="mt-8 px-6 py-2 border border-zinc-700 hover:border-white transition-colors">End Session</button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-6">Your Status</h2>

              <button
                onClick={() => setIsLive(!isLive)}
                className={`w-40 h-40 rounded-full border-8 transition-all flex flex-col items-center justify-center gap-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] mx-auto ${isLive
                  ? 'bg-[#CEFF1A] border-white shadow-[0_0_60px_#CEFF1A] scale-105'
                  : 'bg-zinc-800 border-zinc-700 opacity-50 grayscale hover:opacity-75'
                  }`}
              >
                <div className={`w-4 h-4 rounded-full ${isLive ? 'bg-red-600 animate-ping' : 'bg-zinc-600'}`} />
                <span className={`font-black text-xl uppercase ${isLive ? 'text-black' : 'text-zinc-500'}`}>
                  {isLive ? 'LIVE' : 'OFFLINE'}
                </span>
              </button>

              <p className="mt-8 text-zinc-500 text-sm">
                {isLive ? "You are online! Keep this tab open to receive calls." : "Tap to Go Live and accept calls."}
              </p>
            </>
          )}
        </div>

        {/* INCOMING CALL MODAL */}
        {incomingCall && !isCalling && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <div className="bg-[#CEFF1A] border-4 border-white p-8 shadow-[10px_10px_0px_0px_#D652FF] text-black text-center rotate-1 max-w-sm w-full mx-4">
              <h2 className="text-4xl font-black italic uppercase mb-2 animate-pulse">Incoming!</h2>
              <p className="font-mono font-bold text-xl mb-8">{incomingCall.type.toUpperCase()} • {incomingCall.from || 'Guest'}</p>
              <div className="flex gap-4">
                <button onClick={() => handleAcceptCall(incomingCall.type)} className="flex-1 py-4 bg-black text-white font-black uppercase text-xl hover:scale-105 transition-transform">Answer</button>
                <button onClick={handleRejectCall} className="flex-1 py-4 bg-red-600 text-white font-black uppercase text-xl border-2 border-black hover:scale-105 transition-transform">Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* REQUESTS QUEUE logic */}
        <div className="w-full max-w-md z-10">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-lg">Waitlist</h3>
            <span className="text-xs text-zinc-500">{requests.length} Requests</span>
          </div>

          {requests.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-600 italic">
              No pending requests.
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((req, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{req.from || 'Guest'}</p>
                    <p className="text-xs text-zinc-500">{new Date(req.time).toLocaleTimeString()}</p>
                  </div>
                  <button className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">Message</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }
  // --------------------------------------------------------------------------
  // NEO THEME (Default)
  // --------------------------------------------------------------------------
  if (isCalling) {
    return (
      <div className="fixed inset-0 z-[200] bg-black">
        {/* Earnings Badge for Creator */}
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] bg-green-500/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-green-500/50 flex items-center gap-4">
          <span className="text-green-400 font-bold uppercase tracking-tighter text-[10px]">💰 Earning</span>
          <span className="font-mono font-bold text-xl text-white">+{tokensEarned} TKN</span>
        </div>
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 font-mono text-xs uppercase tracking-widest p-12">
          <span className="block text-4xl mb-4">🚧</span>
          <p>Call Service Unavailable</p>
          <p className="text-[10px] mt-2 opacity-50">Please check back later.</p>
          <button onClick={handleEndCall} className="mt-8 px-6 py-2 border border-zinc-700 hover:border-white transition-colors">End Session</button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 font-mono">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      {/* Top Bar */}
      <nav className="relative z-10 flex justify-between items-center mb-8 border-b-4 border-white pb-4 bg-black">
        <h1 className="text-2xl font-black uppercase tracking-tighter">
          Studio <span className="text-[#CEFF1A]">///</span> {username}
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-zinc-500 font-bold text-xs uppercase hover:text-white"
          >
            [ Exit ]
          </button>
          <button
            onClick={() => logout()}
            className="text-red-500 font-bold text-xs uppercase hover:text-red-400"
          >
            [ Logout ]
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT COL: CONTROLS */}
        <div className="space-y-8">

          {/* LIVE SWITCH */}
          <div className="bg-zinc-900 border-4 border-white p-6 shadow-[8px_8px_0px_0px_#CEFF1A]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black uppercase">Status</h2>
              <div className={`w-4 h-4 rounded-full border-2 border-black ${isLive ? 'bg-[#CEFF1A] animate-pulse' : 'bg-red-500'}`} />
            </div>

            <button
              onClick={() => setIsLive(!isLive)}
              className={`w-full py-4 font-black text-2xl uppercase border-2 border-white transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_#fff] ${isLive ? 'bg-[#CEFF1A] text-black' : 'bg-red-600 text-white'}`}
            >
              {isLive ? 'ONLINE (RECEIVING)' : 'OFFLINE'}
            </button>
            <p className="mt-4 text-[10px] text-zinc-500 font-mono uppercase">
              {isLive ? '>> Waiting for incoming calls...' : '>> You are not visible to callers.'}
            </p>
          </div>

          {/* INCOMING CALL ALERT */}
          {incomingCall && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur flex flex-col items-center justify-center animate-in zoom-in duration-300">
              <div className="bg-[#CEFF1A] border-4 border-white p-8 shadow-[10px_10px_0px_0px_#D652FF] text-black text-center rotate-1 max-w-sm w-full mx-4">
                <h2 className="text-4xl font-black italic uppercase mb-2 animate-pulse">Incoming!</h2>
                <p className="font-mono font-bold text-xl mb-8">{incomingCall.type.toUpperCase()} • {incomingCall.from || 'Guest'}</p>
                <div className="flex gap-4">
                  <button onClick={() => handleAcceptCall(incomingCall.type)} className="flex-1 py-4 bg-black text-white font-black uppercase text-xl hover:scale-105 transition-transform">Answer</button>
                  <button onClick={handleRejectCall} className="flex-1 py-4 bg-red-600 text-white font-black uppercase text-xl border-2 border-black hover:scale-105 transition-transform">Reject</button>
                </div>
              </div>
            </div>
          )}

          {/* STATS */}
          <div className="bg-black border-2 border-zinc-700 p-6">
            <h3 className="text-zinc-500 font-bold uppercase text-xs mb-4 border-b border-zinc-800 pb-2">Session Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-3xl font-black text-white">{tokensEarned}</span>
                <span className="text-[10px] text-zinc-500 uppercase">Tokens Earned</span>
              </div>
              <div>
                <span className="block text-3xl font-black text-white">{requests.length}</span>
                <span className="text-[10px] text-zinc-500 uppercase">Calls Total</span>
              </div>
            </div>
          </div>

          {/* REQUESTS QUEUE */}
          <div className="bg-black border-2 border-zinc-700 p-6">
            <h3 className="text-zinc-500 font-bold uppercase text-xs mb-4 border-b border-zinc-800 pb-2">Messages / Requests</h3>
            {requests.length === 0 ? (
              <div className="text-zinc-700 text-center italic text-xs py-4">
                No pending messages.
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((req, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 p-2 text-xs flex justify-between items-center">
                    <span className="font-bold text-white">{req.from || 'Guest'}</span>
                    <span className="text-zinc-600">{new Date(req.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COL: SETTINGS */}
        <div className="bg-zinc-900 border-2 border-white p-6 shadow-[8px_8px_0px_0px_#fff]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase">Configuration</h2>
            {!showSettings ? (
              <button onClick={() => setShowSettings(true)} className="text-xs bg-white text-black font-bold px-3 py-1 border-2 border-black hover:bg-zinc-200 uppercase">
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveSettings} className="text-xs bg-[#CEFF1A] text-black font-bold px-3 py-1 border-2 border-black hover:opacity-80 uppercase">Save</button>
                <button onClick={() => setShowSettings(false)} className="text-xs bg-red-500 text-white font-bold px-3 py-1 border-2 border-black hover:opacity-80 uppercase">Cancel</button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Rates */}
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Rates (Tokens/Min)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-zinc-400 block mb-1">Video</span>
                  <input
                    type="number"
                    disabled={!showSettings}
                    value={pendingVideoRate}
                    onChange={(e) => setPendingVideoRate(Number(e.target.value))}
                    className="w-full bg-black border-2 border-zinc-700 p-2 text-white font-bold focus:border-[#CEFF1A] outline-none disabled:opacity-50 font-mono"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block mb-1">Audio</span>
                  <input
                    type="number"
                    disabled={!showSettings}
                    value={pendingAudioRate}
                    onChange={(e) => setPendingAudioRate(Number(e.target.value))}
                    className="w-full bg-black border-2 border-zinc-700 p-2 text-white font-bold focus:border-[#CEFF1A] outline-none disabled:opacity-50 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Profile Image */}
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Avatar</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-white bg-zinc-800 overflow-hidden">
                  {pendingProfileImage ? (
                    <img src={pendingProfileImage} className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full bg-zinc-800" />}
                </div>
                {showSettings && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="text-xs text-zinc-500 file:bg-white file:text-black file:border-0 file:px-2 file:py-1 file:font-bold file:uppercase file:text-xs hover:file:bg-zinc-200"
                  />
                )}
              </div>
            </div>

            {/* Socials */}
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Social Links</label>
              <div className="space-y-2">
                {['instagram', 'x', 'youtube', 'website'].map((platform) => (
                  <div key={platform} className="flex items-center gap-2">
                    <div className="w-6 flex justify-center">
                      <img src={`https://simpleicons.org/icons/${platform}.svg`} className="w-4 h-4 invert opacity-50" />
                    </div>
                    <input
                      type="text"
                      placeholder={platform}
                      disabled={!showSettings}
                      value={(pendingSocials as any)[platform]}
                      onChange={(e) => setPendingSocials({ ...pendingSocials, [platform]: e.target.value })}
                      className="flex-1 bg-black border-b border-zinc-800 p-1 text-xs text-white focus:border-[#CEFF1A] outline-none disabled:opacity-50 font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 text-center">
              <button onClick={() => router.push(`/${username}`)} className="text-xs text-[#CEFF1A] hover:underline uppercase font-bold">
                [ View Public Profile ]
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* SYSTEM STATUS (DEBUG) */}
      {!!session?.user && (
        <div className="mt-12 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl max-w-md w-full z-10 font-mono text-left">
          <p className="text-[10px] text-zinc-500 uppercase mb-2 animate-pulse">Session Diagnostic (Logged In)</p>
          <div className="space-y-2 text-[10px] text-zinc-400">
            <div className="bg-black p-2 rounded border border-zinc-800 flex justify-between">
              <span className="text-zinc-600">Email:</span>
              <span className="text-white truncate max-w-[150px]">{session?.user?.email}</span>
            </div>
            <div className="bg-black p-2 rounded border border-zinc-800 flex justify-between">
              <span className="text-zinc-600">Username:</span>
              <span className="text-white">{username || 'NULL'}</span>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/studio'}
            className="w-full mt-4 bg-white text-black font-black py-2 uppercase text-[10px] hover:bg-zinc-200 transition-colors"
          >
            Force Enter Studio →
          </button>
        </div>
      )}
    </main>
  );
}
