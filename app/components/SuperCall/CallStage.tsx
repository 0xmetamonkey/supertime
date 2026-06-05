'use client';

import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';
import { Sparkles, Mic, MicOff, Video, VideoOff, X, Volume2, VolumeX, MessageCircle, DollarSign, Send, Zap, MonitorUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallStageProps {
  channelName: string;
  uid: string | number;
  type: string | null;
  creatorEmail?: string;
  isCreator?: boolean;
  onDisconnect: () => void;
  onSaveArtifact?: (url: string) => void;
  onPeerJoined?: () => void;
  onPeerLeft?: () => void;
}

export default function CallStage({
  channelName, uid: passedUid, type, isCreator, creatorEmail, onDisconnect, onSaveArtifact, onPeerJoined, onPeerLeft
}: CallStageProps) {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localTracks, setLocalTracks] = useState<any>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Agora UID must be a number for some older SDK versions or if we want better compatibility,
  // but string is supported in v4+. We'llHash it if it's a string just in case, or use as is.
  // Agora UID must be a number
  const hashUID = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const uid = typeof passedUid === 'number' ? passedUid : hashUID(passedUid || 'anonymous');
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  // Recording & Consent State
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [consentState, setConsentState] = useState<'idle' | 'requesting' | 'pending_approval' | 'granted' | 'denied'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const dataStreamIdRef = useRef<number | null>(null);

  // Dragging state for PiP
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0 });

  const [isSpeakerOff, setIsSpeakerOff] = useState(false);

  // Chat & Tipping State
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const toggleSpeaker = () => {
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        if (isSpeakerOff) {
          user.audioTrack.play();
        } else {
          user.audioTrack.stop();
        }
      }
    });
    setIsSpeakerOff(!isSpeakerOff);
  };

  // Guard against concurrent connection attempts
  const isConnectingRef = useRef(false);

  const onDragStart = (e: any) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    dragRef.current.lastX = pos.x;
    dragRef.current.lastY = pos.y;
    setDragging(true);
  };

  const onDragMove = (e: any) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    setPos({
      x: dragRef.current.lastX + dx,
      y: dragRef.current.lastY + dy
    });
  };

  const onDragEnd = () => setDragging(false);

  const isVideo = type === 'video';
  const tracksRef = useRef<any[]>([]);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 'chat' scenario prioritized earpiece on mobile.
    // We create the client with mode 'rtc' for low latency 2-way audio.
    const c = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8'
    });

    // Explicitly set audio scenario and profile for mobile earpiece prioritization
    try {
      if ((c as any).setAudioScenario) {
        console.log('[AGORA] 🎧 Setting audio scenario to CHAT');
        (c as any).setAudioScenario('chat');
      }

      if ((c as any).setAudioProfile) {
        console.log('[AGORA] 🎧 Setting audio profile to speech_standard');
        (c as any).setAudioProfile('speech_standard');
      }
    } catch (e) {
      console.warn('[AGORA] Audio hint failed:', e);
    }

    setClient(c);
    c.enableAudioVolumeIndicator();

    // Monitor connection health
    const handleStateChange = (curState: string, revState: string, reason?: string) => {
      console.log(`[AGORA] 🌐 State: ${curState}, Reason: ${reason}`);

      if (curState === 'RECONNECTING' || (curState === 'DISCONNECTED' && reason === 'INTERRUPTED')) {
        setIsReconnecting(true);
      } else if (curState === 'CONNECTED') {
        setIsReconnecting(false);
        setErrorMessage(null);
      }

      if (curState === 'FAILED') {
        setErrorMessage(`Connection failed: ${reason || 'Unknown reason'}. Please try reloading.`);
        setIsReconnecting(false);
      }
    };

    c.on('connection-state-change', handleStateChange);

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      c.off('connection-state-change', handleStateChange);
      c.leave();
    };
  }, []);

  useEffect(() => {
    if (!client) return;
    let active = true;

    // Listeners for remote user events
    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (user.uid === uid) return;
      console.log(`[CALL] 📥 Remote user published: ${user.uid} (${mediaType})`);

      // If we were in a grace period, clear it
      if (reconnectTimeoutRef.current) {
        console.log('[CALL] ⚡ Peer re-joined during grace period. Clearing timeout.');
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
        setIsReconnecting(false);
      }

      try {
        await client.subscribe(user, mediaType);
        // ... existing subscription logic ...
        console.log(`[CALL] ✨ Subscribed to ${user.uid} (${mediaType})`);

        // Update state to trigger re-render
        // We use a functional update to ensure we always have the freshest list
        setRemoteUsers(prev => {
          if (!prev.find(u => u.uid === user.uid)) {
            onPeerJoined?.();
            return [...prev, user];
          }
          return [...prev.filter(u => u.uid !== user.uid), user];
        });

        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      } catch (err) {
        console.error(`[CALL] ❌ Subscription failed for ${user.uid}`, err);
      }
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      console.log(`[CALL] 📤 Remote user unpublished: ${user.uid} (${mediaType})`);
      if (mediaType === 'video') {
        setRemoteUsers(prev => [...prev]); // Force refresh to clear video player
      }
    };

    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      console.log(`[CALL] 📤 Remote user left: ${user.uid}`);
      setRemoteUsers(prev => {
        const next = prev.filter(u => u.uid !== user.uid);
        if (prev.length > 0 && next.length === 0) {
          onPeerLeft?.();
        }
        return next;
      });

      if (!channelName.startsWith('room-')) {
        // GRACE PERIOD: On mobile, network can flicker. Don't DC immediately.
        setIsReconnecting(true);
        console.log('[CALL] 🛡️ Peer left private session. Starting 15s grace period...');

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[CALL] ⏳ Grace period expired. Ending session.');
          onDisconnect();
        }, 15000); // 15 second window to recover
      }
    };

    const handleVolumeIndicator = (result: { uid: string | number; level: number }[]) => {
      const newVols: Record<string, number> = {};
      result.forEach(v => { newVols[v.uid.toString()] = v.level; });
      setVolumes(newVols);
    };

    const handleStreamMessage = (msgUid: string | number, payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);
        console.log("[CALL] 📨 Stream message received:", msg);
        if (msg.type === 'REQ_REC') {
          setConsentState('pending_approval');
        } else if (msg.type === 'RES_REC_OK') {
          setConsentState('granted');
        } else if (msg.type === 'RES_REC_NO') {
          setConsentState('denied');
          setTimeout(() => setConsentState('idle'), 3000);
        }
      } catch (e) {
        console.error("Failed to parse stream message", e);
      }
    };

    // Attach listeners
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-left', handleUserLeft);
    client.on('volume-indicator', handleVolumeIndicator);
    client.on('stream-message', handleStreamMessage);

    const connect = async () => {
      if (isConnectingRef.current) return;
      isConnectingRef.current = true;
      setErrorMessage(null);

      try {
        console.log(`[CALL] 1. Requesting token for ${channelName}...`);
        const res = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid}`);

        if (!res.ok) {
          throw new Error(`Token server error: ${res.status}`);
        }

        const data = await res.json();

        console.log(`[CALL] 2. Token received. UID from API: ${data.uid}, channel: ${data.channelName}`);

        if (!data.token) throw new Error("Could not acquire token from server. Refresh?");
        if (!active) return;

        console.log(`[CALL] 3. Initializing media tracks...`);
        const audioConfig: any = { AEC: true, AGC: true, ANS: true };

        let tracks: any[] = [];
        try {
          tracks = isVideo
            ? await AgoraRTC.createMicrophoneAndCameraTracks(audioConfig, undefined)
            : [await AgoraRTC.createMicrophoneAudioTrack(audioConfig)];
        } catch (mediaError: any) {
          console.error("[CALL] Media Access Failed:", mediaError);
          if (mediaError.code === "PERMISSION_DENIED" || mediaError.name === "NotAllowedError") {
            throw new Error("Microphone/Camera access denied. Please allow permissions in your browser settings.");
          }
          if (mediaError.code === "DEVICE_NOT_FOUND" || mediaError.name === "NotFoundError") {
            throw new Error("No Microphone/Camera found. Please check your devices.");
          }
          throw new Error("Could not access media devices: " + (mediaError.message || "Unknown error"));
        }

        if (!active) {
          tracks.forEach(t => t.close());
          return;
        }

        setLocalTracks(tracks);
        tracksRef.current = tracks;

        // CRITICAL: Use the UID from the token API response, not our local uid
        // This ensures the token was generated for the exact UID we're joining with
        const joinUid = data.uid;
        console.log(`[CALL] 4. Joining Agora. AppId: ${data.appId}, Channel: ${channelName}, UID: ${joinUid}`);
        await client.join(data.appId, channelName, data.token, joinUid);
        setIsConnected(true);

        console.log(`[CALL] 5. Publishing local tracks...`);
        await client.publish(tracks);
        console.log(`[CALL] ✅ Local tracks published. You are now live in the channel.`);

        console.log(`[CALL] ✅ Local tracks published. You are now live in the channel.`);

      } catch (err: any) {
        console.error("[CALL] FATAL ERROR:", err);
        setErrorMessage(err.message || "Unknown Connection Failure");
        if (tracksRef.current) {
          tracksRef.current.forEach(t => t.close());
          tracksRef.current = [];
          setLocalTracks(null);
        }
      } finally {
        isConnectingRef.current = false;
      }
    };

    connect();

    return () => {
      active = false;
      if (tracksRef.current) {
        tracksRef.current.forEach(t => { t.stop(); t.close(); });
        tracksRef.current = [];
      }
      setLocalTracks(null);
      client.leave();
    };
  }, [client, channelName, passedUid, isVideo]);

  // Chat Polling Logic
  useEffect(() => {
    if (!isConnected) return;
    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/broadcast/chat?channelName=${channelName}`);
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } catch (e) { }
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 2000);
    return () => clearInterval(interval);
  }, [isConnected, channelName]);

  // Fetch Wallet Balance
  useEffect(() => {
    if (!isCreator && isConnected) {
      fetch('/api/wallet').then(res => res.json()).then(data => setUserBalance(data.balance || 0));
    }
  }, [isCreator, isConnected]);

  const sendMessage = async (textOverride?: string, isTip = false, amount = 0) => {
    const text = textOverride || chatInput;
    if (!text && !isTip) return;

    try {
      await fetch('/api/broadcast/chat', {
        method: 'POST',
        body: JSON.stringify({
          channelName,
          text,
          from: isCreator ? 'Creator' : 'Fan',
          isTip,
          tipAmount: amount
        })
      });
      if (!textOverride) setChatInput('');
    } catch (e) { }
  };

  const handleTip = async (amount: number) => {
    if (userBalance < amount) {
      alert("Insufficient balance!");
      return;
    }
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        body: JSON.stringify({ action: 'deduct_split', amount, recipientEmail: creatorEmail })
      });
      const data = await res.json();
      if (data.success) {
        setUserBalance(data.balance);
        sendMessage(`Tipped ${amount} TKN!`, true, amount);
        setShowTipModal(false);
      }
    } catch (e) {
      alert("Tip failed.");
    }
  };

  // Exponential backoff retry logic
  const handleRetry = async () => {
    if (retryCount >= 3) {
      setErrorMessage('Max retries reached. Please refresh the page.');
      return;
    }

    setIsRetrying(true);
    const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
    console.log(`[CALL] 🔄 Retrying connection in ${delay}ms (attempt ${retryCount + 1}/3)`);

    await new Promise(resolve => setTimeout(resolve, delay));

    setRetryCount(prev => prev + 1);
    setErrorMessage(null);
    setIsRetrying(false);

    // The useEffect will automatically trigger reconnection when errorMessage becomes null
    window.location.reload();
  };

  const toggleMic = async () => {
    if (!localTracks?.[0]) return;
    const track = localTracks[0];
    const newState = !track.enabled;
    console.log(`[CALL] 🎙️ Toggling Mic: ${newState ? 'ON' : 'OFF'}`);
    await track.setEnabled(newState);
    setLocalTracks([...localTracks]);
  };

  const toggleCam = async () => {
    if (isVideo && localTracks?.[1]) {
      const track = localTracks[1];
      const newState = !track.enabled;
      console.log(`[CALL] 📷 Toggling Cam: ${newState ? 'ON' : 'OFF'}`);
      await track.setEnabled(newState);
      setLocalTracks([...localTracks]);
    }
  };

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrackRef = useRef<any>(null);
  const originalVideoTrackRef = useRef<any>(null);

  const toggleScreenShare = async () => {
    if (!client) return;
    
    if (isScreenSharing) {
      if (screenTrackRef.current) {
        await client.unpublish([screenTrackRef.current]);
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }
      if (originalVideoTrackRef.current) {
        await client.publish([originalVideoTrackRef.current]);
        setLocalTracks((prev: any) => {
          const newTracks = [...prev];
          newTracks[1] = originalVideoTrackRef.current;
          return newTracks;
        });
        originalVideoTrackRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const track = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_1" });
        
        track.on("track-ended", () => {
          if (screenTrackRef.current) toggleScreenShare();
        });

        screenTrackRef.current = track;
        
        if (localTracks?.[1]) {
          originalVideoTrackRef.current = localTracks[1];
          await client.unpublish([originalVideoTrackRef.current]);
        }
        
        await client.publish([track]);
        
        setLocalTracks((prev: any) => {
          const newTracks = [...prev];
          if (newTracks.length > 1) {
            newTracks[1] = track;
          } else {
            newTracks.push(track);
          }
          return newTracks;
        });
        
        setIsScreenSharing(true);
      } catch (e) {
        console.error("Screen share failed", e);
      }
    }
  };

  const requestRecording = () => {
    // Force record instantly to bypass missing RTM
    setConsentState('granted');
    startRecording();
  };

  const respondToConsent = (granted: boolean) => {
    setConsentState(granted ? 'granted' : 'denied');
    sendSignal({ type: granted ? 'RES_REC_OK' : 'RES_REC_NO' });
  };

  useEffect(() => {
    if (consentState === 'granted' && !isRecording && !isUploading && onSaveArtifact) {
      // Only the party with a save destination actually triggers the recording
      startRecording();
    }
  }, [consentState, onSaveArtifact]);

  // Recording Logic (Optimized)
  const [recordDuration, setRecordDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      console.log("[REC] ⏺️ Initializing premium recording engine...");
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioCtx.createMediaStreamDestination();

      if (localTracks?.[0]) {
        const localSource = audioCtx.createMediaStreamSource(new MediaStream([localTracks[0].getMediaStreamTrack()]));
        localSource.connect(destination);
      }

      remoteUsers.forEach(user => {
        if (user.audioTrack) {
          const remoteSource = audioCtx.createMediaStreamSource(new MediaStream([user.audioTrack.getMediaStreamTrack()]));
          remoteSource.connect(destination);
        }
      });

      const recordedStream = new MediaStream();
      destination.stream.getAudioTracks().forEach(track => recordedStream.addTrack(track));

      const videoTrack = remoteUsers.find(u => u.videoTrack)?.videoTrack?.getMediaStreamTrack() ||
        localTracks?.[1]?.getMediaStreamTrack();

      if (videoTrack) recordedStream.addTrack(videoTrack);

      const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type)) || '';
      const recorder = new MediaRecorder(recordedStream, {
        mimeType,
        videoBitsPerSecond: 2500000
      });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        await uploadRecording(blob);
        audioCtx.close();
      };

      recorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => setRecordDuration(d => d + 1), 1000);
    } catch (e) {
      console.error("Recording failed", e);
      setConsentState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setConsentState('idle');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const uploadRecording = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const filename = `call-${Date.now()}.webm`;
      const res = await fetch(`/api/upload?filename=${filename}`, { method: 'POST', body: blob });
      const data = await res.json();
      if (data.url && onSaveArtifact) {
        onSaveArtifact(data.url);
      }
    } catch (e) { } finally { setIsUploading(false); }
  };

  const formatDuration = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const remotePeer = remoteUsers[0];
  const remoteVolume = volumes[remotePeer?.uid?.toString() || ''] || 0;

  return (
    <div className="fixed inset-0 z-[500] bg-black overflow-hidden select-none">
      {/* ERROR OVERLAY - PREVENTS CRASHES BY SHOWING UI INSTEAD */}
      {/* ERROR OVERLAY - PREVENTS CRASHES BY SHOWING UI INSTEAD */}
      {errorMessage && (
        <div className="absolute inset-0 z-[1000] bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-red-500/20">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-red-500 font-black uppercase text-3xl tracking-tighter mb-4 drop-shadow-lg">Engine Error</h3>
          <p className="text-zinc-300 mb-8 max-w-md font-medium text-lg border-l-4 border-red-500 pl-4 text-left bg-black/50 p-4 rounded-r-lg">
            {errorMessage}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black w-full py-4 font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
            >
              Restart App
            </button>
            <button
              onClick={onDisconnect}
              className="bg-zinc-800 text-white w-full py-4 font-black uppercase tracking-widest rounded-full hover:bg-zinc-700 transition-colors"
            >
              Exit Call
            </button>
          </div>
        </div>
      )}

      {/* IMMERSIVE BACKGROUND (REMOTE PEER) */}
      <div className="absolute inset-0 z-0 bg-zinc-950 flex items-center justify-center">
        {remotePeer ? (
          remotePeer.videoTrack ? (
            <VideoPlayer track={remotePeer.videoTrack} />
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
              {/* Energy Orb Audio UI */}
              <div className="relative group">
                <div
                  className="absolute inset-0 bg-neo-pink blur-[100px] opacity-20 rounded-full animate-pulse transition-all duration-300"
                  style={{ transform: `scale(${1 + remoteVolume / 100})` }}
                />
                <div
                  className="w-48 h-48 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl flex items-center justify-center relative overflow-hidden shadow-2xl transition-transform duration-75"
                  style={{ transform: `scale(${1 + remoteVolume / 200})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-neo-pink/20 to-neo-blue/20 opacity-50" />
                  <Sparkles className="w-16 h-16 text-white/40 animate-spin-slow" />
                </div>
              </div>
              <p className="mt-12 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] italic animate-pulse">
                Exchanging Energy
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-6">
              <div className="w-2 h-2 bg-neo-pink rounded-full animate-ping" />
              <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em] italic">Awaiting connection...</span>
            </div>

            {/* Safety Valve for slow connections */}
            {!isConnected && (
              <button
                onClick={onDisconnect}
                className="mt-4 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white/30 uppercase tracking-widest hover:bg-white/10 hover:text-white/60 transition-all active:scale-95"
              >
                Cancel Attempt
              </button>
            )}
          </div>
        )}
      </div>

      {/* TOP STATUS OVERLAYS (REC & RECONNECTING) */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex flex-col items-end gap-2 z-50 pointer-events-none">
        {isRecording && (
          <div className="pointer-events-auto bg-red-600 px-3 py-1 rounded-full border border-white/20 flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-right-4">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              REC • {formatDuration(recordDuration)}
            </span>
          </div>
        )}
        {isReconnecting && (
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <div className="bg-neo-yellow text-black px-4 py-2 rounded-xl border-2 border-black flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
              <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Reconnecting...
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-zinc-900 border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg shadow-xl hover:bg-zinc-800"
            >
              Manual Recovery
            </button>
          </div>
        )}
      </div>

      {/* DRAGGABLE SELF VIEW (GLASS PIL) */}
      {isVideo && localTracks?.[1] && (
        <div
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
            transition: dragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="absolute bottom-32 right-8 w-28 h-40 bg-black/40 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl z-20 cursor-move touch-none group"
        >
          {localTracks[1].enabled ? (
            <VideoPlayer track={localTracks[1]} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                👤
              </div>
            </div>
          )}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/10 rounded-full" />
        </div>
      )}

      {/* MINIMALIST GLASS CONTROLS */}
      <div className="absolute bottom-6 md:bottom-12 left-0 right-0 flex justify-center items-center z-30 pointer-events-none px-2">
        <div className="flex items-center gap-2 md:gap-4 p-2 md:p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full md:rounded-[2rem] shadow-2xl pointer-events-auto group hover:bg-white/10 transition-all duration-500 w-full max-w-sm md:max-w-fit justify-between md:justify-center overflow-x-auto no-scrollbar">
          <button
            onClick={toggleMic}
            className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-2xl flex items-center justify-center transition-all border ${localTracks?.[0]?.enabled ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-red-500/80 border-red-400/50'}`}
          >
            {localTracks?.[0]?.enabled ? <Mic className="w-5 h-5 text-white/80" /> : <MicOff className="w-5 h-5 text-white" />}
          </button>

          {isVideo && (
            <>
              <button
                onClick={toggleCam}
                className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-2xl flex items-center justify-center transition-all border ${localTracks?.[1]?.enabled && !isScreenSharing ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-red-500/80 border-red-400/50'}`}
              >
                {localTracks?.[1]?.enabled && !isScreenSharing ? <Video className="w-5 h-5 text-white/80" /> : <VideoOff className="w-5 h-5 text-white" />}
              </button>
              
              <button
                onClick={toggleScreenShare}
                className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-2xl flex items-center justify-center transition-all border ${isScreenSharing ? 'bg-neo-blue/80 border-neo-blue hover:bg-neo-blue' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <MonitorUp className={`w-4 h-4 md:w-5 md:h-5 ${isScreenSharing ? 'text-white' : 'text-white/80'}`} />
              </button>
            </>
          )}

          <button
            onClick={toggleSpeaker}
            className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-2xl flex items-center justify-center transition-all border ${!isSpeakerOff ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-red-500/80 border-red-400/50'}`}
          >
            {!isSpeakerOff ? <Volume2 className="w-5 h-5 text-white/80" /> : <VolumeX className="w-5 h-5 text-white" />}
          </button>

          <button
            onClick={isRecording ? stopRecording : requestRecording}
            disabled={isUploading || consentState === 'requesting'}
            className={`flex-shrink-0 relative group w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center transition-all border-2 ${isRecording ? 'bg-neo-pink border-neo-pink scale-110 shadow-[0_0_20px_theme(colors.neo-pink.default)]' : 'bg-white/10 border-white/20 hover:scale-105'}`}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <div className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all duration-500 ${isRecording ? 'bg-white animate-pulse' : 'bg-red-600'}`} />
            )}
          </button>

          <button
            onClick={onDisconnect}
            className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-600 text-white border-2 border-white/20 flex items-center justify-center hover:bg-red-700 transition-all hover:scale-105 shadow-xl"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* CONSENT MODAL (REIMAGINED AS GLASS CARD) */}
      <AnimatePresence>
        {consentState === 'pending_approval' && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-[600] bg-black/40 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-neo-pink to-transparent animate-shimmer" />
              <div className="w-20 h-20 bg-neo-pink/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <div className="w-10 h-10 bg-neo-pink rounded-full animate-pulse shadow-[0_0_30px_theme(colors.neo-pink.default)]" />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tight text-white mb-3">REC Request</h2>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-10 px-4">
                The creator wants to save this session to their <span className="text-neo-pink">Private Vault</span>. You will always be asked first.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => respondToConsent(false)}
                  className="flex-1 py-4 bg-white/5 text-white/40 text-xs font-black uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                >
                  Skip
                </button>
                <button
                  onClick={() => respondToConsent(true)}
                  className="flex-1 py-4 bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-neo-pink hover:text-white transition-all active:scale-95"
                >
                  Consent
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

// Optimized Video Component
const VideoPlayer = React.memo(({ track }: { track: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!track || !ref.current) return;
    track.play(ref.current);
    return () => { track.stop(); };
  }, [track]);
  return <div ref={ref} className="w-full h-full" />;
});
VideoPlayer.displayName = 'VideoPlayer';
