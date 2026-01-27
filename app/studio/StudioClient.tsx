'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '../actions';
import AgoraCall from '../components/AgoraCall';

export default function StudioClient({ username, session, initialSettings }: { username: string, session: any, initialSettings?: any }) {
  const router = useRouter();
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

  if (isCalling) {
    return (
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
                <p className="font-mono font-bold text-xl mb-8">{incomingCall.type.toUpperCase()} • Guest</p>
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
                {['instagram', 'twitter', 'youtube', 'website'].map((platform) => (
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
    </main>
  );
}
