'use client';

import React, { useEffect, useRef, useState } from 'react';
import AgoraAppBuilder from "@appbuilder/react";

type ConnectionState = 'IDLE' | 'INITIALIZING' | 'JOINING' | 'CONNECTED' | 'FAILED' | 'DISCONNECTED';

type AgoraCallProps = {
  channelName: string;
  uid: string;
  remoteName?: string;
  callType?: 'audio' | 'video';
  onEndCall?: () => void;
  onTimeUpdate?: (seconds: number) => void;
};

export default function AgoraCall({
  channelName,
  uid,
  remoteName = 'Guest',
  callType = 'video',
  onEndCall,
  onTimeUpdate
}: AgoraCallProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const startCall = async () => {
      setConnectionState('INITIALIZING');
      try {
        console.log("🚀 Launching Agora App Builder...");

        // Ensure the room name is clean and consistent
        // We use the same channel naming logic as before
        const roomId = channelName.toLowerCase().trim();

        // joinRoom handles token acquisition and UID mapping internally via the SDK
        await AgoraAppBuilder.joinRoom(roomId, uid || "User");

        setConnectionState('CONNECTED');
        console.log("✅ Joined via App Builder");
      } catch (err: any) {
        console.error("❌ App Builder Join Failed:", err);
        setErrorMsg(err.message || "Failed to join room");
        setConnectionState('FAILED');
      }
    };

    startCall();

    return () => {
      console.log("🧹 Cleaning up App Builder...");
      if (typeof AgoraAppBuilder.logout === 'function') {
        AgoraAppBuilder.logout();
      }
    };
  }, [channelName, uid]);

  // CALL TIMER
  useEffect(() => {
    if (connectionState !== 'CONNECTED') return;
    const timer = setInterval(() => {
      setCallDuration(prev => {
        const next = prev + 1;
        if (onTimeUpdate) onTimeUpdate(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [connectionState, onTimeUpdate]);

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
        <h2 className="text-2xl font-black text-red-500 mb-4 uppercase italic">Fatal Error</h2>
        <p className="text-zinc-500 mb-8 font-mono">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black font-black uppercase rounded-full">Restart System</button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">

      {/* THE AGORA ENGINE - Battle tested and Agora-managed */}
      <div className="flex-1 w-full relative z-0">
        <AgoraAppBuilder.View />
      </div>

      {/* TOP HUD (Stats Overlaid) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/80 backdrop-blur-xl border-2 border-white/20 rounded-full z-[500] flex items-center gap-4 shadow-2xl pointer-events-none">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${connectionState === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-mono text-xs font-black text-white uppercase tracking-widest">
            {connectionState === 'INITIALIZING' ? 'WAITING' : connectionState}
          </span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <span className="font-mono text-sm font-black text-[#CEFF1A]">
          {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
        </span>
      </div>

      {/* EMERGENCY EXIT */}
      <div className="absolute bottom-6 right-6 z-[600]">
        <button
          onClick={onEndCall}
          className="px-6 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/50 rounded-full text-xs font-black uppercase transition-all backdrop-blur-md"
        >
          End Call
        </button>
      </div>

      {/* DIAGNOSTIC MINI-STRIP */}
      <div className="absolute bottom-2 left-0 right-0 p-1 flex justify-center gap-4 text-[9px] font-mono text-zinc-600 tracking-tighter uppercase z-[120] pointer-events-none">
        <span>Channel: {channelName}</span>
        <span>Engine: App Builder v3.1.13</span>
        <span>Stability: Indestructible</span>
      </div>

    </div>
  );
}
