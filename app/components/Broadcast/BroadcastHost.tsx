'use client';

import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, Phone, MessageCircle, DollarSign, Users, X } from 'lucide-react';

interface BroadcastHostProps {
  channelName: string;
  uid: string;
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

// Tip sound effect
const playTipSound = () => {
  const audio = new Audio('/sounds/tip.mp3');
  audio.volume = 0.7;
  audio.play().catch(() => { }); // Ignore if autoplay blocked
};

export default function BroadcastHost({ channelName, uid, onEnd, onCallRequest }: BroadcastHostProps) {
  const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: 'live', codec: 'vp8', role: 'host' }));
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [callRequests, setCallRequests] = useState<any[]>([]);

  const videoRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
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

    // Listen for incoming chat messages via data stream
    client.on('stream-message', (uid, data) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(data));
        if (msg.type === 'chat') {
          setMessages(prev => [...prev, {
            id: Math.random().toString(36).slice(2),
            from: msg.from || `User-${uid}`,
            text: msg.text,
            isTip: msg.isTip,
            tipAmount: msg.tipAmount,
            timestamp: Date.now()
          }]);
          if (msg.isTip) playTipSound();
        }
      } catch (e) {
        console.error('[Broadcast] Failed to parse stream message:', e);
      }
    });

    startBroadcast();

    return () => {
      active = false;
      if (tracksRef.current) {
        tracksRef.current.forEach((t: any) => t.close());
      }
      client.leave();
    };
  }, [channelName, uid]);

  // Poll for chat messages from viewers
  useEffect(() => {
    if (!isConnected) return;

    let lastTimestamp = 0;
    const pollMessages = async () => {
      try {
        const res = await fetch(`/api/broadcast/chat?channelName=${encodeURIComponent(channelName)}&since=${lastTimestamp}`);
        const data = await res.json();
        if (data.messages?.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMsgs = data.messages.filter((m: any) => !existingIds.has(m.id));
            if (newMsgs.some((m: any) => m.isTip)) playTipSound();
            return [...prev, ...newMsgs];
          });
          lastTimestamp = Math.max(...data.messages.map((m: any) => m.timestamp));
        }
      } catch (e) {
        console.error('[Chat] Poll failed:', e);
      }
    };

    const interval = setInterval(pollMessages, 2000); // Poll every 2 seconds
    pollMessages(); // Initial poll

    return () => clearInterval(interval);
  }, [channelName, isConnected]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle incoming tip (would come from Ably/API in real implementation)
  const handleIncomingTip = (from: string, amount: number, message?: string) => {
    playTipSound();
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      from,
      text: message || `Tipped ${amount} TKN! 🎉`,
      isTip: true,
      tipAmount: amount,
      timestamp: Date.now()
    }]);
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

  // End broadcast
  const handleEnd = async () => {
    if (localTracks) {
      localTracks.forEach(t => t.close());
    }
    await client.leave();
    onEnd();
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black flex">
      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Live Indicator + Viewer Count */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-sm">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-black uppercase">LIVE</span>
          </div>
          <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-sm">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold">{viewerCount}</span>
          </div>
        </div>

        {/* Video Container */}
        <div
          ref={videoRef}
          className="w-full h-full bg-zinc-900"
          style={{ transform: 'scaleX(-1)' }} // Mirror for selfie view
        />

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full border-4 border-white flex items-center justify-center transition-all ${isMuted ? 'bg-red-500' : 'bg-white/20'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>
          <button
            onClick={handleEnd}
            className="w-16 h-16 rounded-full bg-red-600 border-4 border-white flex items-center justify-center"
          >
            <Phone className="w-7 h-7 text-white rotate-[135deg]" />
          </button>
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full border-4 border-white flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500' : 'bg-white/20'}`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-80 bg-zinc-900 border-l-4 border-black flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b-2 border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-neo-green" />
            <span className="text-white font-black uppercase text-sm">Live Chat</span>
          </div>
          <span className="text-xs text-zinc-500">{messages.length} msgs</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-zinc-500 text-xs text-center italic">Waiting for viewers...</p>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`p-2 rounded ${msg.isTip ? 'bg-neo-yellow/20 border border-neo-yellow' : 'bg-zinc-800'}`}
              >
                {msg.isTip && (
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="w-4 h-4 text-neo-yellow" />
                    <span className="text-neo-yellow text-xs font-black">+{msg.tipAmount} TKN</span>
                  </div>
                )}
                <p className="text-white text-sm">
                  <span className="font-bold text-neo-pink">{msg.from}:</span> {msg.text}
                </p>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Call Requests */}
        {callRequests.length > 0 && (
          <div className="p-4 border-t-2 border-zinc-800 space-y-2">
            <p className="text-xs font-black uppercase text-neo-pink">1:1 Call Requests</p>
            {callRequests.map((req, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-800 p-2 rounded">
                <span className="text-white text-sm font-bold">{req.from}</span>
                <div className="flex gap-2">
                  <button className="bg-neo-green text-black text-xs px-2 py-1 font-black">Accept</button>
                  <button className="bg-red-500 text-white text-xs px-2 py-1 font-black">Deny</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Test Tip Button (Dev Only) */}
        <div className="p-4 border-t-2 border-zinc-800">
          <button
            onClick={() => handleIncomingTip('TestUser', 50, 'Great stream!')}
            className="w-full bg-neo-yellow text-black py-2 font-black text-xs uppercase"
          >
            [DEV] Simulate Tip
          </button>
        </div>
      </div>
    </div>
  );
}
