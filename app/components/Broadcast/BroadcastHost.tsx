'use client';

import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Phone, MessageCircle, DollarSign, Users, X, Send, Volume2, VolumeX } from 'lucide-react';
import { useBroadcastChat } from '@/app/lib/ably';

interface BroadcastHostProps {
  channelName: string;
  uid: string;
  username: string;
  onEnd: () => void;
  onCallRequest?: (request: any) => void;
}

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  isTip?: boolean;
  tipAmount?: number;
  timestamp: number;
}

// Tip sound effect - Programmatic "Ding" for guaranteed feedback
const playTipSound = () => {
  try {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // High-pitched "Coin" sound (two-tone sequence)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);

    // Also attempt to play the file if it exists as a layer
    const audio = new Audio('/sounds/tip.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => { });
  } catch (e) {
    console.error('AudioContext failed:', e);
  }
};

export default function BroadcastHost({ channelName, uid, username, onEnd, onCallRequest }: BroadcastHostProps) {
  const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: 'live', codec: 'vp8', role: 'host' }));
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const { messages, setMessages, sendMessage: sendAblyMessage } = useBroadcastChat(channelName, username);
  const [callRequests, setCallRequests] = useState<any[]>([]);

  const videoRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const dataStreamIdRef = useRef<number | null>(null);

  // Initialize broadcast
  useEffect(() => {
    let active = true;
    const tracksRef = { current: null as any };

    const startBroadcast = async () => {
      try {
        // Get token
        const res = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid}`);
        const data = await res.json();
        if (!data.token || !active) return;

        // Create tracks
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (!active) {
          tracks.forEach(t => t.close());
          return;
        }
        tracksRef.current = tracks;
        setLocalTracks(tracks);

        // Join as host (broadcaster)
        await client.join(data.appId, channelName, data.token, data.uid);
        setIsConnected(true);

        // Publish stream
        await client.publish(tracks);
        console.log('[Broadcast] Host is live');

        // Play local video
        if (videoRef.current) {
          tracks[1].play(videoRef.current);
        }
      } catch (err) {
        console.error('[Broadcast] Error:', err);
      }
    };

    // Listen for viewer count changes
    client.on('user-joined', () => setViewerCount(v => v + 1));
    client.on('user-left', () => setViewerCount(v => Math.max(0, v - 1)));

    startBroadcast();

    // Initial fetch of message history (optional, keeping for robustness)
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/broadcast/chat?channelName=${encodeURIComponent(channelName)}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMsgs = data.messages.filter((m: any) => !existingIds.has(m.id));
            return [...newMsgs, ...prev].sort((a, b) => a.timestamp - b.timestamp);
          });
        }
      } catch (e) { }
    };
    fetchHistory();

    return () => {
      active = false;
      if (tracksRef.current) {
        tracksRef.current.forEach((t: any) => t.close());
      }
      client.leave();
    };
  }, [channelName, uid]);

  // Tip sound effect when new tipped messages arrive (Recency check enabled)
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.isTip && lastMsg.timestamp > sessionStartTimeRef.current) {
      playTipSound();
    }
  }, [messages.length]);

  // Auto-scroll chat manually
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);


  // Send chat message via Ably
  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const text = chatInput;
    setChatInput('');

    try {
      const msg = await sendAblyMessage(text);
      // Persist to API as well for history
      fetch('/api/broadcast/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msg.id,
          channelName,
          message: text,
          from: username
        })
      });
    } catch (e) {
      console.error('[Chat] Send failed:', e);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (localTracks) {
      localTracks[0].setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localTracks) {
      localTracks[1].setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // Music State
  const [musicTrack, setMusicTrack] = useState<any>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(30);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [showMusicMenu, setShowMusicMenu] = useState(false);

  const SUPERTIME_BEATS = [
    { title: "Neon Nights", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { title: "Cyber Dreams", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { title: "Lo-Fi Glow", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
  ];

  const startMusic = async (index: number) => {
    try {
      if (musicTrack) {
        await client.unpublish(musicTrack);
        musicTrack.stop();
        musicTrack.close();
      }

      const track = await AgoraRTC.createBufferSourceAudioTrack({
        source: SUPERTIME_BEATS[index].url,
      });

      track.startProcessAudioBuffer({ loop: true });
      track.setVolume(musicVolume);

      await client.publish(track);
      setMusicTrack(track);
      setCurrentTrackIndex(index);
      setIsMusicPlaying(true);
      console.log(`[Music] Playing: ${SUPERTIME_BEATS[index].title}`);
    } catch (e) {
      console.error("[Music] Failed to start:", e);
    }
  };

  const stopMusic = async () => {
    if (musicTrack) {
      await client.unpublish(musicTrack);
      musicTrack.stop();
      musicTrack.close();
      setMusicTrack(null);
      setIsMusicPlaying(false);
      setCurrentTrackIndex(-1);
    }
  };

  const handleVolumeChange = (v: number) => {
    setMusicVolume(v);
    if (musicTrack) musicTrack.setVolume(v);
  };

  const toggleSpeaker = () => {
    // Agora client in broadcast mode handles remote users differently but we can iterate through remote users
    // For simplicity and consistency with CallStage:
    client.remoteUsers.forEach(user => {
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // End broadcast
  const handleEnd = async () => {
    if (isRecording) stopRecording();
    if (localTracks) {
      localTracks.forEach(t => t.close());
    }
    await client.leave();
    onEnd();
  };

  const startRecording = async () => {
    try {
      console.log("[REC] ⏺️ Initializing premium broadcast recording...");
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioCtx.createMediaStreamDestination();

      if (localTracks?.[0]) {
        const localSource = audioCtx.createMediaStreamSource(new MediaStream([localTracks[0].getMediaStreamTrack()]));
        localSource.connect(destination);
      }

      const recordedStream = new MediaStream();
      destination.stream.getAudioTracks().forEach(track => recordedStream.addTrack(track));

      if (localTracks?.[1]) {
        const videoTrack = localTracks[1].getMediaStreamTrack();
        if (videoTrack) recordedStream.addTrack(videoTrack);
      }

      const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type)) || '';
      const recorder = new MediaRecorder(recordedStream, { mimeType, videoBitsPerSecond: 3000000 });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        console.log("[REC] 💾 Recording stopped, preparing upload...");
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        await uploadRecording(blob);
        audioCtx.close();
      };

      recorder.start(1000);
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => setRecordDuration(d => d + 1), 1000);
    } catch (e) {
      console.error("Recording failed", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const uploadRecording = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const filename = `broadcast-${Date.now()}.webm`;
      const res = await fetch(`/api/upload?filename=${filename}`, { method: 'POST', body: blob });
      const data = await res.json();
      if (data.url) {
        await fetch('/api/studio/update', {
          method: 'POST',
          body: JSON.stringify({ artifact: data.url })
        });
        console.log("[REC] ✅ Broadcast artifact saved:", data.url);
      }
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col md:flex-row overflow-hidden h-[100dvh]">
      {/* Video Area */}
      <div className="h-[40%] md:h-full md:flex-1 relative border-b-4 md:border-b-0 md:border-r-4 border-black overflow-hidden bg-zinc-950 shrink-0">
        <div ref={videoRef} className="w-full h-full" style={{ transform: 'scaleX(-1)' }} />

        {/* TOP HUD: STATUS & STATS */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-start z-10 pointer-events-none">
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pointer-events-auto items-start">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 px-3 py-1 rounded-full border border-white/20 flex items-center gap-2 shadow-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[9px] md:text-[11px] font-black uppercase tracking-tighter">LIVE</span>
              </div>
              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 text-white shadow-xl">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black">{viewerCount}</span>
              </div>
            </div>

            {isRecording && (
              <div className="bg-neo-pink px-3 py-1 rounded-full border border-white/20 flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-left-4">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span className="text-white text-[9px] md:text-[11px] font-black uppercase tracking-tighter whitespace-nowrap">
                  REC • {formatDuration(recordDuration)}
                </span>
              </div>
            )}

          </div>
        </div>

        {/* BOTTOM CONTROL DOCK */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center z-30 pointer-events-none">
          <div className="flex items-center gap-4 p-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl pointer-events-auto group hover:bg-black/60 transition-all duration-500">
            <button onClick={toggleMute} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border ${!isMuted ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-red-500 border-red-400'}`}>
              {!isMuted ? <Mic className="w-5 h-5 text-white/80" /> : <MicOff className="w-5 h-5 text-white" />}
            </button>

            <button onClick={toggleVideo} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border ${!isVideoOff ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-red-500 border-red-400'}`}>
              {!isVideoOff ? <Video className="w-5 h-5 text-white/80" /> : <VideoOff className="w-5 h-5 text-white" />}
            </button>

            <button
              onClick={handleEnd}
              className="px-6 h-14 rounded-2xl bg-red-600 text-white border-2 border-white/20 flex items-center justify-center hover:bg-red-700 transition-all hover:scale-105 shadow-xl"
            >
              <X className="w-5 h-5 mr-2" />
              <span className="font-black uppercase text-xs tracking-tighter">End Stream</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {true && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full md:w-80 bg-zinc-950 flex flex-col min-h-0 relative border-l-0 md:border-l-4 border-black overflow-hidden"
          >
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-white" />
                <span className="text-white font-black uppercase text-[10px] tracking-widest">Live Chat</span>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 touch-pan-y custom-scrollbar"
            >
              {messages.map(msg => (
                <div key={msg.id} className="animate-in slide-in-from-bottom-2">
                  {msg.isTip ? (
                    <div className="bg-neo-yellow/10 border border-neo-yellow/20 p-2 rounded-lg mb-2">
                      <span className="text-neo-yellow text-[10px] font-black uppercase block mb-1">TIP +{msg.tipAmount} TKN</span>
                      <p className="text-white text-sm leading-tight italic">"{msg.text}"</p>
                    </div>
                  ) : (
                    <p className="text-zinc-200 text-sm leading-snug">
                      <span className="font-bold text-neo-blue/80 mr-1.5">{msg.from}:</span>
                      <span className="opacity-90">{msg.text}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t-2 border-zinc-800 bg-zinc-900 z-10 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Broadcasting to everyone..."
                  className="flex-1 bg-zinc-800 text-white px-3 py-2 text-sm outline-none border-2 border-transparent focus:border-neo-green font-bold min-w-0"
                />
                <button
                  onClick={sendMessage}
                  className="bg-neo-green text-black px-4 py-2 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
}
