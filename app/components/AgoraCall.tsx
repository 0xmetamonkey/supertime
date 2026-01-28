'use client';

import React, { useEffect, useRef, useState } from 'react';

// Dynamic import to avoid SSR issues
let AgoraRTC: any;

// Global helper to unify String UID to Integer (Must match API)
const hashStringToInt = (uid: string) => {
  if (!uid) return 0;
  return Math.abs(uid.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0)) % 2147483647;
};

type ConnectionState = 'IDLE' | 'INITIALIZING' | 'JOINING' | 'CONNECTED' | 'RECONNECTING' | 'FAILED' | 'DISCONNECTED';

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
  // Refs for persistent SDK objects
  const clientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);
  const initLockRef = useRef(false); // THE LOCK: Prevents React 18 double-init
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);

  // UI State
  const [connectionState, setConnectionState] = useState<ConnectionState>('IDLE');
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);

  // 1. DISPOSAL LOGIC (The "Master Switch")
  const cleanup = async () => {
    console.log("🛠️ Starting Indestructible Cleanup...");

    // Stop & Close local tracks
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current.close();
      localVideoTrackRef.current = null;
    }

    // Leave the channel
    if (clientRef.current) {
      try {
        await clientRef.current.leave();
        console.log("✅ Left Agora Channel");
      } catch (e) {
        console.warn("⚠️ Error during leave", e);
      }
      clientRef.current = null;
    }

    setRemoteUsers([]);
    initLockRef.current = false;
  };

  // 2. INITIALIZATION
  useEffect(() => {
    // Prevent double-firing in React 18 StrictMode
    if (initLockRef.current) return;
    initLockRef.current = true;

    const startCall = async () => {
      setConnectionState('INITIALIZING');

      try {
        // A. Load SDK
        if (!AgoraRTC) {
          AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        }

        // B. Handshake Validation
        const safeChannel = channelName.toLowerCase().trim();
        const joinUid = hashStringToInt(uid);

        if (!safeChannel) throw new Error("Missing Channel Name");
        if (!joinUid) throw new Error("Could not generate valid UID");

        // C. Fetch Token
        const tokenRes = await fetch(`/api/agora?channelName=${safeChannel}&uid=${uid}`);
        if (!tokenRes.ok) throw new Error(`Token Server Error: ${tokenRes.status}`);
        const { token, appId: serverAppId } = await tokenRes.json();

        const appId = serverAppId || process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();
        if (!appId) throw new Error("Agora App ID is missing");

        // D. Create Client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        // E. Setup SDK Listeners
        client.on('connection-state-change', (curState: string, revState: string) => {
          console.log(`📡 Network State: ${revState} -> ${curState}`);
          setConnectionState(curState as ConnectionState);
        });

        client.on('user-published', async (user: any, mediaType: 'audio' | 'video') => {
          await client.subscribe(user, mediaType);
          console.log(`📥 Subscribed to ${mediaType} from ${user.uid}`);

          setRemoteUsers((prev) => {
            const others = prev.filter(u => u.uid !== user.uid);
            return [...others, user];
          });

          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
          // Video handled by the reactive effect below
        });

        client.on('user-left', (user: any) => {
          setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
        });

        // F. Join Room
        setConnectionState('JOINING');
        try {
          await client.join(appId, safeChannel, token, joinUid);
        } catch (joinErr) {
          console.warn("⚠️ Token Join Failed. Reverting to Fail-Safe...", joinErr);
          await client.join(appId, safeChannel, null, joinUid);
        }

        // G. Create & Publish Tracks
        if (callType === 'video') {
          const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks(
            { echoCancellation: true, noiseSuppression: true, AEC: true, AGC: true },
            { encoderConfig: '720p_1' }
          );
          localAudioTrackRef.current = mic;
          localVideoTrackRef.current = cam;

          if (localVideoRef.current) {
            cam.play(localVideoRef.current);
          }
          await client.publish([mic, cam]);
        } else {
          const mic = await AgoraRTC.createMicrophoneAudioTrack(
            { echoCancellation: true, noiseSuppression: true, AEC: true, AGC: true }
          );
          localAudioTrackRef.current = mic;
          await client.publish([mic]);
        }

        setConnectionState('CONNECTED');

      } catch (err: any) {
        console.error("❌ Indestructible Init Failed:", err);

        // Handle specific browser permission errors
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
          setErrorMsg("CAMERA_BLOCKED");
        } else {
          setErrorMsg(err.message || "Failed to connect");
        }
        setConnectionState('FAILED');
      }
    };

    startCall();

    return () => {
      cleanup();
    };
  }, [channelName, uid, callType]);

  // 3. REACTIVE TRACK ATTACHMENT
  useEffect(() => {
    if (remoteUsers.length > 0) {
      const user = remoteUsers[0]; // Currently supporting 1:1

      const attachVideo = () => {
        if (user.videoTrack && remoteVideoRef.current) {
          user.videoTrack.play(remoteVideoRef.current);
          console.log("🎬 Remote video projected to DOM");
          return true;
        }
        return false;
      };

      if (!attachVideo()) {
        const retry = setInterval(() => {
          if (attachVideo()) clearInterval(retry);
        }, 500);
        return () => clearInterval(retry);
      }
    }
  }, [remoteUsers]);

  // 4. CALL TIMER
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

  // UI HELPERS
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMute = () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleVideoToggle = () => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleSpeakerToggle = () => {
    remoteUsers.forEach(u => {
      if (u.audioTrack) {
        isSpeakerOff ? u.audioTrack.play() : u.audioTrack.stop();
      }
    });
    setIsSpeakerOff(!isSpeakerOff);
  };

  if (errorMsg) {
    if (errorMsg === "CAMERA_BLOCKED") {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-10 text-center animate-in fade-in duration-500">
          <div className="text-6xl mb-6 animate-bounce">🔒</div>
          <h2 className="text-3xl font-black text-[#CEFF1A] mb-4 uppercase italic">Camera Access Blocked</h2>
          <p className="text-zinc-400 mb-8 max-w-sm leading-relaxed">
            Your browser blocked the camera/mic.
            Click the <span className="text-white font-bold inline-flex items-center gap-1 mx-1">🔒 icon</span> in your URL bar and select <span className="text-white font-bold">"Reset Permissions"</span> or <span className="text-white font-semibold">"Allow."</span>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-10 py-4 bg-white text-black font-black uppercase rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            I've Unblocked It - Try Again
          </button>
        </div>
      );
    }

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

      {/* REMOTE VIDEO (The Stage) */}
      <div className="absolute inset-0 z-0">
        <div ref={remoteVideoRef} className="w-full h-full object-cover" />

        {/* Waiting / Reconnecting UI */}
        {(remoteUsers.length === 0 || connectionState === 'RECONNECTING') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-20 h-20 border-4 border-[#CEFF1A] border-t-transparent rounded-full animate-spin mb-6" />
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white animate-pulse">
              {connectionState === 'RECONNECTING' ? "Reconnecting..." : `Waiting for ${remoteName}...`}
            </h3>
          </div>
        )}
      </div>

      {/* PICTURE IN PICTURE (Local View) */}
      {callType === 'video' && (
        <div className="absolute top-20 right-4 w-32 h-44 bg-zinc-900 rounded-3xl overflow-hidden border-2 border-zinc-700 shadow-2xl z-50">
          <div ref={localVideoRef} className="w-full h-full object-cover grayscale brightness-75" />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <span className="text-4xl">🎬</span>
            </div>
          )}
        </div>
      )}

      {/* TOP HUD (Stats) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full z-[100] flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionState === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-mono text-sm font-bold text-white uppercase tracking-widest">{connectionState}</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <span className="font-mono text-sm font-bold text-[#CEFF1A]">{formatTime(callDuration)}</span>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-[100]">

        {/* Mute */}
        <button
          onClick={handleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 ${isMuted ? 'bg-red-600 border-red-500 text-white' : 'bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20'}`}
        >
          {isMuted ? '🔇' : '🎙️'}
        </button>

        {/* End Call */}
        <button
          onClick={onEndCall}
          className="w-20 h-20 bg-red-600 border-4 border-white/20 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.5)] hover:scale-110 active:scale-90 transition-all font-black"
        >
          <span className="text-white text-3xl">✖</span>
        </button>

        {/* Video Toggle */}
        {callType === 'video' && (
          <button
            onClick={handleVideoToggle}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 ${isVideoOff ? 'bg-red-600 border-red-500 text-white' : 'bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20'}`}
          >
            {isVideoOff ? '🚫' : '📹'}
          </button>
        )}

        {/* Speaker Toggle (Audio Only) */}
        {callType === 'audio' && (
          <button
            onClick={handleSpeakerToggle}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 ${isSpeakerOff ? 'bg-zinc-800 border-zinc-700' : 'bg-white/10 border-white/20'}`}
          >
            {isSpeakerOff ? '🔇' : '🔊'}
          </button>
        )}
      </div>

      {/* DIAGNOSTIC MINI-STRIP (Professional Only) */}
      <div className="absolute bottom-2 left-0 right-0 p-1 flex justify-center gap-4 text-[9px] font-mono text-zinc-600 tracking-tighter uppercase z-[120]">
        <span>Ch: {channelName.slice(0, 10)}</span>
        <span>ID: {hashStringToInt(uid).toString().slice(0, 6)}</span>
        <span>Peers: {remoteUsers.length}</span>
        <span>Codec: VP8</span>
        {remoteUsers.length > 0 && <span className="text-[#CEFF1A]">Live Media Active</span>}
      </div>

    </div>
  );
}
