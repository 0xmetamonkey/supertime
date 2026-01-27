'use client';

import React, { useState, useEffect } from 'react';
import { logout } from '../actions';
import AgoraCall from '../components/AgoraCall';

export default function StudioClient({ username, session, initialSettings }: { username: string, session: any, initialSettings?: any }) {
  // State
  const [isLive, setIsLive] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string, type: 'audio' | 'video' } | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [requests, setRequests] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [pendingVideoRate, setPendingVideoRate] = useState(initialSettings?.videoRate ?? 100);
  const [pendingAudioRate, setPendingAudioRate] = useState(initialSettings?.audioRate ?? 50);
  const [pendingSocials, setPendingSocials] = useState(initialSettings?.socials ?? { instagram: '', twitter: '', youtube: '', website: '' });
  const [pendingProfileImage, setPendingProfileImage] = useState(initialSettings?.profileImage || '');
  const [isUploading, setIsUploading] = useState(false);

  const saveSettings = async () => {
    try {
      await fetch('/api/studio/update', {
        method: 'POST',
        body: JSON.stringify({
          socials: pendingSocials,
          videoRate: pendingVideoRate,
          audioRate: pendingAudioRate,
          profileImage: pendingProfileImage
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

  // Polling for Incoming Calls
  useEffect(() => {
    if (!isLive || isCalling) return;

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
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4 (Standard ring)

      // Create a pulsing effect (Ring... Ring...)
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.0);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.0);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();

      // Loop the beep every 4 seconds
      const loop = setInterval(() => {
        const osc = ctx.createOscillator();
        const gn = ctx.createGain();
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gn.gain.setValueAtTime(0, ctx.currentTime);
        gn.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
        gn.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
        osc.connect(gn);
        gn.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      }, 3000);

      return () => {
        clearInterval(loop);
        oscillator.stop();
        ctx.close();
      };
    }
  }, [incomingCall, isCalling]);

  // Polling for Requests (Queue)
  useEffect(() => {
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

            {/* PROFILE IMAGE */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden mb-3 relative group">
                {pendingProfileImage ? (
                  <img src={pendingProfileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">No Image</div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <label className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1 rounded-full cursor-pointer transition-colors">
                {isUploading ? "Uploading..." : "Upload Photo"}
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
            </div>

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
              {['instagram', 'twitter', 'youtube', 'website'].map((platform) => (
                <div key={platform} className="flex items-center bg-black border border-zinc-700 rounded-xl px-4 py-3">
                  <span className="text-zinc-600 text-xs uppercase w-20 font-bold">{platform}</span>
                  <input type="text" value={(pendingSocials as any)[platform]} onChange={(e) => setPendingSocials({ ...pendingSocials, [platform]: e.target.value })} className="flex-1 bg-transparent border-none outline-none text-white text-sm" placeholder="URL..." />
                </div>
              ))}
            </div>

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
          <div className="py-6">
            <h2 className="text-2xl font-bold text-green-400 mb-2">🔴 IN CALL</h2>
            <div className="flex justify-center gap-8 mb-4">
              <div className="text-center">
                <span className="text-xs text-zinc-400 block">Duration</span>
                <span className="font-mono font-bold text-2xl text-white">{formatTime(callDuration)}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-zinc-400 block">Earning</span>
                <span className="font-mono font-bold text-2xl text-green-400">+{tokensEarned} TKN</span>
              </div>
            </div>
            <button
              onClick={handleEndCall}
              className="bg-red-500 px-8 py-3 rounded-full text-white font-bold hover:bg-red-600 transition-colors"
            >
              End Call
            </button>
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

      {/* CALL UI (Full Screen Overlay) */}
      {isCalling && (
        <div className="fixed inset-0 z-[200] bg-black">
          {/* Earnings Badge for Creator */}
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] bg-green-500/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-green-500/50 flex items-center gap-4">
            <span className="text-green-400 font-bold">💰 Earning</span>
            <span className="font-mono font-bold text-xl text-white">+{tokensEarned} TKN</span>
          </div>
          <AgoraCall
            channelName={`channel-${username}`}
            uid={username}
            callType={callType}
            onEndCall={handleEndCall}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
      )}

      {/* INCOMING CALL MODAL */}
      {incomingCall && !isCalling && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur flex flex-col items-center justify-center animate-in zoom-in duration-300">
          <div className="bg-[#CEFF1A] border-4 border-white p-8 shadow-[10px_10px_0px_0px_#D652FF] text-black text-center rotate-1 max-w-sm w-full mx-4">
            <h2 className="text-4xl font-black italic uppercase mb-2 animate-pulse">Incoming!</h2>
            <p className="font-mono font-bold text-xl mb-8">{incomingCall.type.toUpperCase()} • Guest</p>
            <div className="flex gap-4">
              <button onClick={answerCall} className="flex-1 py-4 bg-black text-white font-black uppercase text-xl hover:scale-105 transition-transform">Answer</button>
              <button onClick={rejectCall} className="flex-1 py-4 bg-red-600 text-white font-black uppercase text-xl border-2 border-black hover:scale-105 transition-transform">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* REQUESTS QUEUE */}
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
                  <p className="text-xs text-zinc-500">{new Date(req.timestamp).toLocaleTimeString()}</p>
                </div>
                <button className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">Message</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 text-zinc-800 text-xs font-mono">v1.1.0</div>
    </main>
  );
}
