'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '../actions';
import dynamic from 'next/dynamic';
const AgoraCall = dynamic(() => import('../components/AgoraCall'), { ssr: false });
import { useTheme } from '../context/ThemeContext';
import { useSession } from 'next-auth/react';

import WalletManager from '../components/WalletManager';
import { checkAvailability, claimUsername } from '../actions';
import ThemeToggle from '../components/ThemeToggle';

export default function StudioClient({ username, session, initialSettings }: { username: string | null, session: any, initialSettings?: any }) {
  const router = useRouter();
  // State
  const [isLive, setIsLive] = useState(initialSettings?.isLive ?? false);
  const [incomingCall, setIncomingCall] = useState<{
    from: string,
    type: 'audio' | 'video',
    channelName?: string
  } | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [remoteName, setRemoteName] = useState('Guest');
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [pendingVideoRate, setPendingVideoRate] = useState(initialSettings?.videoRate ?? 100);
  const [pendingAudioRate, setPendingAudioRate] = useState(initialSettings?.audioRate ?? 50);
  const [pendingSocials, setPendingSocials] = useState(initialSettings?.socials ?? { instagram: '', x: '', youtube: '', website: '' });
  const [pendingProfileImage, setPendingProfileImage] = useState(initialSettings?.profileImage || '');
  const [pendingTemplates, setPendingTemplates] = useState<any[]>(initialSettings?.templates || []);
  const [pendingAvailability, setPendingAvailability] = useState<any>(initialSettings?.availability || {
    monday: { active: false, start: '09:00', end: '17:00' },
    tuesday: { active: false, start: '09:00', end: '17:00' },
    wednesday: { active: false, start: '09:00', end: '17:00' },
    thursday: { active: false, start: '09:00', end: '17:00' },
    friday: { active: false, start: '09:00', end: '17:00' },
    saturday: { active: false, start: '09:00', end: '17:00' },
    sunday: { active: false, start: '09:00', end: '17:00' },
  });
  const [artifacts, setArtifacts] = useState<any[]>(initialSettings?.artifacts || []);
  const [isUploading, setIsUploading] = useState(false);

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
          availability: pendingAvailability,
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
          console.log('[StudioClient] Incoming call signal:', data);
          setIncomingCall({
            from: data.from || 'Guest',
            type: data.type || 'video',
            channelName: data.channelName
          });
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
        const now = ctx.currentTime;
        // Harmonic Arpeggio (iPhone-style)
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

  // Polling for Bookings
  useEffect(() => {
    if (!username) return;
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/call/book?mode=received');
        const data = await res.json();
        if (data.bookings) setBookings(data.bookings);
      } catch (e) { }
    };
    fetchBookings();
    const interval = setInterval(fetchBookings, 20000);
    return () => clearInterval(interval);
  }, [username]);

  const handleSaveArtifact = async (url: string) => {
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        body: JSON.stringify({ artifact: url })
      });
      // Update local state
      const newArtifact = {
        id: Math.random().toString(36).slice(2, 9),
        url,
        timestamp: Date.now(),
        type: 'video'
      };
      setArtifacts(prev => [newArtifact, ...prev]);
      alert("Highlight saved to profile!");
    } catch (e) {
      console.error("Failed to save artifact", e);
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    if (!username) {
      alert("Error: You must claim a username before accepting calls.");
      return;
    }

    if (incomingCall.channelName) {
      console.log('[StudioClient] Answering with channel:', incomingCall.channelName);
      setActiveChannelName(incomingCall.channelName);
    }

    if (incomingCall?.from) setRemoteName(incomingCall.from);
    await fetch('/api/call/signal', { method: 'POST', body: JSON.stringify({ action: 'answer', from: username }) });
    setCallType(incomingCall.type);
    setIncomingCall(null);
    setIsCalling(true);
    setCallDuration(0);
    setTokensEarned(0);
  };

  // Lifecycle Safety: If user closes tab, try to send 'end' signal
  useEffect(() => {
    if (!isCalling || !username) return;

    const handleBeforeUnload = () => {
      fetch('/api/call/signal', {
        method: 'POST',
        keepalive: true,
        body: JSON.stringify({ action: 'end', from: username })
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCalling, username]);

  const rejectCall = async () => {
    await fetch('/api/call/signal', { method: 'POST', body: JSON.stringify({ action: 'reject', from: username }) });
    setIncomingCall(null);
  };

  const handleAcceptCall = async (type: 'audio' | 'video') => {
    answerCall();
  }

  const handleRejectCall = () => {
    rejectCall();
  }

  // Timer for active call
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCalling) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  // Update tokens earned based on duration
  useEffect(() => {
    if (!isCalling) return;
    const rate = callType === 'video' ? pendingVideoRate : pendingAudioRate;
    // Calculate per-second earning to match the 1:1 / 60:60 logic
    const durationInMinutes = callDuration / 60;
    const earned = durationInMinutes * rate;
    setTokensEarned(Number(earned.toFixed(2)));
  }, [callDuration, isCalling, callType, pendingVideoRate, pendingAudioRate]);

  const handleEndCall = () => {
    setIsCalling(false);
    setActiveChannelName(null);
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

  // 1. ACTIVE CALL OVERLAY (Highest Precedence)
  if (isCalling && callType) {
    return (
      <div className="fixed inset-0 z-[200] bg-black">
        {/* Minimalist Earning Pill */}
        <div className="absolute top-6 left-6 z-[210] flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-[#CEFF1A] animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Active Earning</span>
            <span className="text-sm font-black text-white tabular-nums">
              {tokensEarned.toFixed(2)} <span className="text-[10px] text-[#CEFF1A]">TKN</span>
            </span>
          </div>
          <div className="h-6 w-[1px] bg-white/10 mx-1" />
          <div className="flex flex-col">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Time</span>
            <span className="text-sm font-bold text-white/90 tabular-nums">{formatTime(callDuration)}</span>
          </div>
        </div>

        <AgoraCall
          channelName={activeChannelName || `supertime-${username}`}
          type={callType}
          onDisconnect={handleEndCall}
          onSaveArtifact={handleSaveArtifact}
        />
      </div>
    );
  }

  // 2. SLICK THEME
  if (theme === 'slick') {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#CEFF1A]/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
          <div className="absolute top-[40%] left-[30%] w-[20%] h-[20%] bg-blue-600/10 blur-[80px] rounded-full" />
        </div>

        <nav className="w-full flex justify-between items-center mb-10 max-w-4xl z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black italic tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">STUDIO</h1>
            <span className="bg-zinc-800/50 backdrop-blur border border-zinc-700 text-zinc-400 text-[10px] px-2 py-1 rounded-md font-mono">{username}</span>
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
          </div>
        </nav>

        {showSettings && (
          <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full relative animate-in zoom-in duration-300">
              <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
              <h2 className="text-2xl font-bold mb-6 text-white">Studio Settings</h2>

              <div className="space-y-6">
                {/* 1. Copy Link (Top) */}
                <div className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center group">
                  <span className="text-xs text-zinc-400 font-mono truncate mr-2">supertime.wtf/{username}</span>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${username}`); alert("Copied!"); }} className="text-xs bg-white text-black font-bold px-3 py-1 rounded-full hover:bg-zinc-200 transition-colors">Copy Link</button>
                </div>

                {/* 2. Avatar / Profile Image */}
                <div className="space-y-3">
                  <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Profile Identity</h3>
                  <div className="flex items-center gap-4 bg-black border border-zinc-700 p-4 rounded-xl">
                    <div className="w-16 h-16 rounded-full border-2 border-zinc-700 bg-zinc-800 overflow-hidden shrink-0">
                      {pendingProfileImage ? (
                        <img src={pendingProfileImage} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs">?</div>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-[10px] text-zinc-300 font-bold uppercase cursor-pointer hover:bg-zinc-700 transition-colors inline-block text-center shadow-lg">
                        Update Photo
                        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                      </label>
                      <p className="text-[10px] text-zinc-600">JPG, PNG or GIF. Max 5MB.</p>
                    </div>
                  </div>
                </div>

                {/* 3. Rates */}
                <div className="space-y-3">
                  <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Call Rates (TKN/min)</h3>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 mb-1 block uppercase">Video</label>
                      <input type="number" value={pendingVideoRate} onChange={(e) => setPendingVideoRate(Number(e.target.value))} className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white font-bold focus:border-[#D652FF] outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 mb-1 block uppercase">Audio</label>
                      <input type="number" value={pendingAudioRate} onChange={(e) => setPendingAudioRate(Number(e.target.value))} className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white font-bold focus:border-[#D652FF] outline-none" />
                    </div>
                  </div>
                </div>

                {/* 4. Social Links */}
                <div className="space-y-3">
                  <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Social Presence</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {['instagram', 'x', 'youtube', 'website'].map((platform) => (
                      <div key={platform} className="flex items-center bg-black border border-zinc-700 rounded-xl px-4 py-3 group focus-within:border-[#D652FF] transition-all">
                        <span className="text-zinc-600 text-[10px] uppercase w-20 font-bold group-focus-within:text-white">{platform}</span>
                        <input type="text" value={(pendingSocials as any)[platform]} onChange={(e) => setPendingSocials({ ...pendingSocials, [platform]: e.target.value })} className="flex-1 bg-transparent border-none outline-none text-white text-sm" placeholder="URL or @username" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Call Templates */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Call Templates</h3>
                    <button
                      onClick={() => setPendingTemplates([...pendingTemplates, { id: Math.random().toString(36).slice(2, 7), duration: 15, price: 100, description: 'Quick chat', type: 'video' }])}
                      className="text-[10px] bg-[#CEFF1A] text-black px-2 py-1 rounded font-bold uppercase"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {pendingTemplates.map((tpl, idx) => (
                      <div key={tpl.id} className="bg-black border border-zinc-700 rounded-xl p-3 space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[8px] text-zinc-500 uppercase">Dur (min)</label>
                            <input
                              type="number"
                              value={tpl.duration}
                              onChange={(e) => {
                                const newTpls = [...pendingTemplates];
                                newTpls[idx].duration = Number(e.target.value);
                                setPendingTemplates(newTpls);
                              }}
                              className="w-full bg-zinc-900 border-none rounded p-1 text-xs text-white"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[8px] text-zinc-500 uppercase">Price (TKN)</label>
                            <input
                              type="number"
                              value={tpl.price}
                              onChange={(e) => {
                                const newTpls = [...pendingTemplates];
                                newTpls[idx].price = Number(e.target.value);
                                setPendingTemplates(newTpls);
                              }}
                              className="w-full bg-zinc-900 border-none rounded p-1 text-xs text-white"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[8px] text-zinc-500 uppercase">Type</label>
                            <select
                              value={tpl.type}
                              onChange={(e) => {
                                const newTpls = [...pendingTemplates];
                                newTpls[idx].type = e.target.value;
                                setPendingTemplates(newTpls);
                              }}
                              className="w-full bg-zinc-900 border-none rounded p-1 text-xs text-white"
                            >
                              <option value="audio">Audio</option>
                              <option value="video">Video</option>
                            </select>
                          </div>
                          <button
                            onClick={() => setPendingTemplates(pendingTemplates.filter(t => t.id !== tpl.id))}
                            className="text-red-500 text-xs mt-4"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="What to expect..."
                          value={tpl.description}
                          onChange={(e) => {
                            const newTpls = [...pendingTemplates];
                            newTpls[idx].description = e.target.value;
                            setPendingTemplates(newTpls);
                          }}
                          className="w-full bg-zinc-900 border-none rounded p-1 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Availability Schedule */}
                <div className="space-y-3">
                  <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Weekly Availability</h3>
                  <div className="space-y-1">
                    {Object.keys(pendingAvailability).map((day) => (
                      <div key={day} className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded-lg">
                        <input
                          type="checkbox"
                          checked={pendingAvailability[day].active}
                          onChange={(e) => setPendingAvailability({ ...pendingAvailability, [day]: { ...pendingAvailability[day], active: e.target.checked } })}
                          className="accent-[#CEFF1A]"
                        />
                        <span className="text-[10px] uppercase font-bold w-20 text-zinc-400">{day}</span>
                        {pendingAvailability[day].active && (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={pendingAvailability[day].start}
                              onChange={(e) => setPendingAvailability({ ...pendingAvailability, [day]: { ...pendingAvailability[day], start: e.target.value } })}
                              className="bg-zinc-900 border-none rounded text-[10px] text-white p-1"
                            />
                            <span className="text-zinc-600">to</span>
                            <input
                              type="time"
                              value={pendingAvailability[day].end}
                              onChange={(e) => setPendingAvailability({ ...pendingAvailability, [day]: { ...pendingAvailability[day], end: e.target.value } })}
                              className="bg-zinc-900 border-none rounded text-[10px] text-white p-1"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theme Toggle & Bottom Actions */}
                <div className="pt-4 border-t border-zinc-800 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-bold uppercase">Appearance</span>
                    <ThemeToggle />
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setShowSettings(false)} className="flex-1 py-4 text-zinc-400 font-bold hover:text-white transition-colors">Cancel</button>
                    <button onClick={saveSettings} className="flex-1 py-4 bg-[#D652FF] text-white font-black rounded-2xl hover:bg-[#b042d1] hover:scale-[1.02] active:scale-95 transition-all shadow-xl">SAVE SETTINGS</button>
                  </div>

                  <button
                    onClick={() => logout()}
                    className="w-full py-4 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 hover:border-red-700 transition-all font-black uppercase text-xs tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(220,38,38,0.3)] rounded-xl"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="z-10 w-full max-w-md bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-3xl p-8 mb-8 text-center shadow-2xl animate-in zoom-in duration-300">

          <>
            <h2 className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-6">Your Status</h2>

            <button
              onClick={async () => {
                const newLiveStatus = !isLive;
                setIsLive(newLiveStatus);
                try {
                  await fetch('/api/studio/update', {
                    method: 'POST',
                    body: JSON.stringify({ isLive: newLiveStatus })
                  });
                } catch (e) {
                  console.error("Failed to sync live status", e);
                }
              }}
              className={`w-48 h-48 rounded-full border-[10px] transition-all duration-500 flex flex-col items-center justify-center gap-2 shadow-[0_0_80px_rgba(0,0,0,0.8)] mx-auto relative group active:scale-95 ${isLive
                ? 'bg-[#CEFF1A] border-white shadow-[0_0_100px_#CEFF1A66] scale-105'
                : 'bg-zinc-900 border-zinc-800 opacity-60 hover:opacity-100 hover:scale-105'
                }`}
            >
              {isLive && (
                <div className="absolute inset-0 rounded-full animate-ping bg-[#CEFF1A] opacity-20" />
              )}
              <div className={`w-5 h-5 rounded-full z-10 ${isLive ? 'bg-red-600 shadow-[0_0_10px_#ff0000]' : 'bg-zinc-600'}`} />
              <span className={`font-black text-2xl uppercase tracking-widest z-10 ${isLive ? 'text-black' : 'text-zinc-500'}`}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </span>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {isLive ? 'Tap to end session' : 'Tap to start earning'}
              </div>
            </button>

            <p className="mt-8 text-zinc-500 text-sm">
              {isLive ? "You are online! Keep this tab open to receive calls." : "Tap to Go Live and accept calls."}
            </p>
          </>
        </div>

        {incomingCall && !isCalling && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-3xl flex flex-col items-center justify-between p-12 text-center animate-in fade-in duration-500">
            {/* Blurred Profile Background */}
            <div className="absolute inset-0 z-[-1] opacity-30">
              <div className="w-full h-full bg-gradient-to-b from-purple-500/20 to-blue-500/20" />
            </div>

            <div className="mt-20">
              <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 p-1 mb-6 mx-auto">
                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-4xl">
                  👤
                </div>
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

        <div className="w-full max-w-md z-10 mt-8">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-lg">Scheduled Calls</h3>
            <span className="text-xs text-zinc-500">{bookings.length} Bookings</span>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-600 italic">
              No scheduled calls.
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map((booking, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{booking.visitorEmail}</p>
                    <p className="text-xs text-zinc-400">{booking.date} at {booking.time}</p>
                    <p className="text-[10px] text-purple-400 uppercase font-bold">{booking.duration} min {booking.type}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[#CEFF1A] font-bold text-xs">{booking.price} TKN</span>
                    <p className="text-[8px] text-zinc-500 uppercase">{booking.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-black text-white p-4 font-mono">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      <nav className="relative z-10 flex justify-between items-center mb-8 border-b-4 border-white pb-4 bg-black">
        <h1 className="text-2xl font-black uppercase tracking-tighter">
          Studio <span className="text-[#CEFF1A]">///</span> {username}
        </h1>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="space-y-8">

          <div className="bg-zinc-900 border-4 border-white p-6 shadow-[8px_8px_0px_0px_#CEFF1A]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black uppercase">Status</h2>
              <div className={`w-4 h-4 rounded-full border-2 border-black ${isLive ? 'bg-[#CEFF1A] animate-pulse' : 'bg-red-500'}`} />
            </div>

            <button
              onClick={async () => {
                const newLiveStatus = !isLive;
                setIsLive(newLiveStatus);
                try {
                  await fetch('/api/studio/update', {
                    method: 'POST',
                    body: JSON.stringify({ isLive: newLiveStatus })
                  });
                } catch (e) {
                  console.error("Failed to sync live status", e);
                }
              }}
              className={`w-full py-4 font-black text-2xl uppercase border-2 border-white transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_#fff] ${isLive ? 'bg-[#CEFF1A] text-black' : 'bg-red-600 text-white'}`}
            >
              {isLive ? 'ONLINE (RECEIVING)' : 'OFFLINE'}
            </button>
            <p className="mt-4 text-[10px] text-zinc-500 font-mono uppercase">
              {isLive ? '>> Waiting for incoming calls...' : '>> You are not visible to callers.'}
            </p>
          </div>

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

        <div className="bg-zinc-900 border-2 border-white p-6 shadow-[8px_8px_0px_0px_#fff]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase tracking-tighter italic">Studio Settings</h2>
            <div className="flex gap-2 items-center">
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
          </div>

          <div className="space-y-8">
            {/* 1. Share Link (Top) */}
            <div className="bg-black border-2 border-zinc-800 p-4 flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-mono truncate mr-2">supertime.wtf/{username}</span>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${username}`); alert("Copied!"); }} className="text-[10px] bg-white text-black font-black px-3 py-1 border-2 border-black hover:bg-[#CEFF1A] uppercase">Copy Link</button>
            </div>

            {/* 2. Identity / Avatar */}
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Profile Identity</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-white bg-zinc-800 overflow-hidden">
                  {pendingProfileImage ? (
                    <img src={pendingProfileImage} className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full bg-zinc-800" />}
                </div>
                {showSettings && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-300 font-bold uppercase cursor-pointer hover:text-[#CEFF1A]">
                      [ Upload Photo ]
                      <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    </label>
                    <span className="text-[9px] text-zinc-600">STATIC_PFP_ENGINE_V1</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Rates */}
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Rates (Tokens/Min)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-zinc-400 block mb-1 uppercase tracking-tighter">Video</span>
                  <input
                    type="number"
                    disabled={!showSettings}
                    value={pendingVideoRate}
                    onChange={(e) => setPendingVideoRate(Number(e.target.value))}
                    className="w-full bg-black border-2 border-zinc-700 p-2 text-white font-bold focus:border-[#CEFF1A] outline-none disabled:opacity-50 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block mb-1 uppercase tracking-tighter">Audio</span>
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

            {/* 4. Social Links */}
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-2">Social Hub</label>
              <div className="space-y-2">
                {['instagram', 'x', 'youtube', 'website'].map((platform) => {
                  const link = (pendingSocials as any)[platform];

                  return (
                    <div key={platform} className="flex items-center gap-2 group">
                      <div className="w-6 flex justify-center">
                        <img src={`https://simpleicons.org/icons/${platform}.svg`} className="w-4 h-4 invert opacity-50 group-focus-within:opacity-100 transition-opacity" />
                      </div>
                      <input
                        type="text"
                        placeholder={platform}
                        disabled={!showSettings}
                        value={link}
                        onChange={(e) => setPendingSocials({ ...pendingSocials, [platform]: e.target.value })}
                        className="flex-1 bg-black border-b border-zinc-800 p-1 text-[10px] text-white focus:border-[#CEFF1A] outline-none disabled:opacity-50 font-mono"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Call Templates (Brutalist) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Call Templates</label>
                {showSettings && (
                  <button
                    onClick={() => setPendingTemplates([...pendingTemplates, { id: Math.random().toString(36).slice(2, 7), duration: 15, price: 100, description: 'Quick chat', type: 'video' }])}
                    className="text-[9px] border border-white px-2 py-0.5 text-white uppercase hover:bg-white hover:text-black transition-all"
                  >
                    + Add New
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {pendingTemplates.length === 0 && <p className="text-[9px] text-zinc-700 italic">No custom templates defined.</p>}
                {pendingTemplates.map((tpl, idx) => (
                  <div key={tpl.id} className="border-2 border-dashed border-zinc-800 p-3">
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <span className="text-[8px] text-zinc-600 block uppercase">MINS</span>
                        <input
                          disabled={!showSettings}
                          type="number"
                          value={tpl.duration}
                          onChange={(e) => {
                            const newTpls = [...pendingTemplates];
                            newTpls[idx].duration = Number(e.target.value);
                            setPendingTemplates(newTpls);
                          }}
                          className="w-full bg-black border border-zinc-800 text-[10px] p-1 outline-none focus:border-white disabled:opacity-50"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[8px] text-zinc-600 block uppercase">TOKENS</span>
                        <input
                          disabled={!showSettings}
                          type="number"
                          value={tpl.price}
                          onChange={(e) => {
                            const newTpls = [...pendingTemplates];
                            newTpls[idx].price = Number(e.target.value);
                            setPendingTemplates(newTpls);
                          }}
                          className="w-full bg-black border border-zinc-800 text-[10px] p-1 outline-none focus:border-white disabled:opacity-50"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[8px] text-zinc-600 block uppercase">TYPE</span>
                        <select
                          disabled={!showSettings}
                          value={tpl.type}
                          onChange={(e) => {
                            const newTpls = [...pendingTemplates];
                            newTpls[idx].type = e.target.value;
                            setPendingTemplates(newTpls);
                          }}
                          className="w-full bg-black border border-zinc-800 text-[10px] p-1 outline-none focus:border-white disabled:opacity-50"
                        >
                          <option value="audio">Audio</option>
                          <option value="video">Video</option>
                        </select>
                      </div>
                      {showSettings && (
                        <button
                          onClick={() => setPendingTemplates(pendingTemplates.filter(t => t.id !== tpl.id))}
                          className="text-red-500 mt-4 px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      disabled={!showSettings}
                      type="text"
                      placeholder="What caller can expect..."
                      value={tpl.description}
                      onChange={(e) => {
                        const newTpls = [...pendingTemplates];
                        newTpls[idx].description = e.target.value;
                        setPendingTemplates(newTpls);
                      }}
                      className="w-full bg-black border-b border-zinc-800 text-[9px] p-1 outline-none focus:border-white disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Availability (Brutalist) */}
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-3 border-b border-zinc-800 pb-1">Weekly Schedule</label>
              <div className="space-y-1">
                {Object.keys(pendingAvailability).map((day) => (
                  <div key={day} className="flex items-center gap-3 border border-zinc-900 p-2">
                    <input
                      disabled={!showSettings}
                      type="checkbox"
                      checked={pendingAvailability[day].active}
                      onChange={(e) => setPendingAvailability({ ...pendingAvailability, [day]: { ...pendingAvailability[day], active: e.target.checked } })}
                      className="w-3 h-3 border-2 border-white bg-black checked:bg-[#CEFF1A]"
                    />
                    <span className="text-[10px] uppercase font-bold w-16 text-zinc-500">{day.slice(0, 3)}</span>
                    {pendingAvailability[day].active && (
                      <div className="flex items-center gap-2 flex-1 font-mono text-[9px]">
                        <input
                          disabled={!showSettings}
                          type="time"
                          value={pendingAvailability[day].start}
                          onChange={(e) => setPendingAvailability({ ...pendingAvailability, [day]: { ...pendingAvailability[day], start: e.target.value } })}
                          className="bg-black border border-zinc-800 text-white p-0.5"
                        />
                        <span className="text-zinc-700">-</span>
                        <input
                          disabled={!showSettings}
                          type="time"
                          value={pendingAvailability[day].end}
                          onChange={(e) => setPendingAvailability({ ...pendingAvailability, [day]: { ...pendingAvailability[day], end: e.target.value } })}
                          className="bg-black border border-zinc-800 text-white p-0.5"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Interface & Account (Bottom) */}
            <div className="pt-6 border-t border-zinc-800 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Interface Mode</span>
                <ThemeToggle />
              </div>

              <div className="flex flex-col gap-4">
                <button onClick={() => router.push(`/${username}`)} className="text-[10px] text-zinc-400 hover:text-[#CEFF1A] uppercase font-bold text-left">
                  [ → View Public Profile ]
                </button>
                <button
                  onClick={() => logout()}
                  className="w-full py-4 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 hover:border-red-700 transition-all font-black uppercase text-xs tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(220,38,38,0.3)]"
                >
                  Sign Out
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

    </main>
  );
}