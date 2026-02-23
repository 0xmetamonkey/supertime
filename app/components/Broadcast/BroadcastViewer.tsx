'use client';

import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IRemoteVideoTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { MessageCircle, Send, DollarSign, Phone, Users, X, Volume2, VolumeX } from 'lucide-react';
import { useBroadcastChat } from '@/app/lib/ably';

interface BroadcastViewerProps {
  channelName: string;
  uid: string;
  creatorUsername: string;
  onLeave: () => void;
  onRequestCall: (type: 'audio' | 'video') => void;
  userBalance: number;
  userDisplayName?: string;
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

export default function BroadcastViewer({
  channelName,
  uid,
  creatorUsername,
  onLeave,
  onRequestCall,
  userBalance,
  userDisplayName
}: BroadcastViewerProps) {
  const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: 'live', codec: 'vp8', role: 'audience' }));
  const [remoteVideo, setRemoteVideo] = useState<IRemoteVideoTrack | null>(null);
  const [remoteAudio, setRemoteAudio] = useState<IRemoteAudioTrack | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [chatInput, setChatInput] = useState('');
  const { messages, setMessages, sendMessage: sendAblyMessage } = useBroadcastChat(channelName, userDisplayName || (uid.startsWith('guest-') ? `Guest-${uid.slice(6, 10)}` : 'Viewer'));
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(50);

  const [isSpeakerOff, setIsSpeakerOff] = useState(false);

  const toggleSpeaker = () => {
    if (remoteAudio) {
      if (isSpeakerOff) {
        remoteAudio.play();
      } else {
        remoteAudio.stop();
      }
    }
    setIsSpeakerOff(!isSpeakerOff);
  };

  const videoRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Join as viewer (audience)
  useEffect(() => {
    let active = true;

    const joinStream = async () => {
      try {
        // Get token
        const res = await fetch(`/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${uid}`);
        const data = await res.json();
        if (!data.token || !active) return;

        // Subscribe to remote streams
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === 'video') {
            setRemoteVideo(user.videoTrack || null);
          }
          if (mediaType === 'audio') {
            setRemoteAudio(user.audioTrack || null);
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') setRemoteVideo(null);
          if (mediaType === 'audio') setRemoteAudio(null);
        });

        client.on('user-joined', () => setViewerCount(v => v + 1));
        client.on('user-left', () => setViewerCount(v => Math.max(1, v - 1)));

        // Join as audience
        await client.join(data.appId, channelName, data.token, data.uid);
        setIsConnected(true);
        console.log('[Viewer] Joined broadcast');
      } catch (err) {
        console.error('[Viewer] Error:', err);
      }
    };

    joinStream();

    return () => {
      active = false;
      client.leave();
    };
  }, [channelName, uid]);

  // Play remote video
  useEffect(() => {
    if (remoteVideo && videoRef.current) {
      remoteVideo.play(videoRef.current);
    }
  }, [remoteVideo]);

  // Auto-scroll chat manually (safer than scrollIntoView on mobile)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial fetch of message history
  useEffect(() => {
    if (!isConnected) return;

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
  }, [channelName, isConnected]);

  // Tip sound effect when new tipped messages arrive (Recency check enabled)
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.isTip && lastMsg.timestamp > sessionStartTimeRef.current) {
      playTipSound();
    }
  }, [messages.length]);

  // Send chat message via Ably
  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const text = chatInput;
    setChatInput('');

    try {
      const msg = await sendAblyMessage(text);
      // Persist to API for history
      fetch('/api/broadcast/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msg.id,
          channelName,
          message: text,
          from: userDisplayName || (uid.startsWith('guest-') ? `Guest-${uid.slice(6, 10)}` : 'Viewer')
        })
      });
    } catch (e) {
      console.error('[Chat] Send failed:', e);
    }
  };

  // Send tip
  const sendTip = async () => {
    if (tipAmount <= 0 || tipAmount > userBalance) return;

    // Deduct from balance and send to creator
    try {
      await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deduct_split',
          amount: tipAmount,
          recipientEmail: '' // Would need creator's email
        })
      });

      setMessages(prev => [...prev, {
        id: Math.random().toString(36).slice(2),
        from: 'You',
        text: `Sent ${tipAmount} TKN tip! 🎉`,
        isTip: true,
        tipAmount: tipAmount,
        timestamp: Date.now()
      }]);

      setShowTipModal(false);

      // Notify via Ably and Persist
      try {
        const announcement = `Sent ${tipAmount} TKN tip! 🎉`;
        const msg = await sendAblyMessage(announcement, true, tipAmount);

        await fetch('/api/broadcast/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: msg.id,
            channelName,
            message: announcement,
            from: userDisplayName || (uid.startsWith('guest-') ? `Guest-${uid.slice(6, 10)}` : 'Viewer'),
            isTip: true,
            tipAmount: tipAmount
          })
        });
      } catch (e) {
        console.error('[Chat] Tip announcement failed:', e);
      }
    } catch (e) {
      console.error('Tip failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col md:flex-row overflow-hidden h-[100dvh]">
      {/* Video Area */}
      <div className="h-[40%] md:h-full md:flex-1 relative border-b-4 md:border-b-0 md:border-r-4 border-black overflow-hidden bg-zinc-900 shrink-0">
        {/* Top Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-sm">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-black uppercase">LIVE</span>
            </div>
            <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-sm">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold">{viewerCount}</span>
            </div>
          </div>
          <button
            onClick={onLeave}
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Video Container */}
        <div ref={videoRef} className="w-full h-full bg-zinc-900" />

        {/* Creator Name */}
        <div className="absolute bottom-4 left-4">
          <p className="text-white font-black text-xl uppercase">{creatorUsername}</p>
        </div>

        {/* Action Buttons (Mobile Bottom) */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button
            onClick={toggleSpeaker}
            className={`p-3 rounded-full border-2 border-black transition-all ${!isSpeakerOff ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-red-500 text-white'}`}
          >
            {!isSpeakerOff ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowTipModal(true)}
            className="p-3 bg-neo-yellow text-black rounded-full border-2 border-black"
          >
            <DollarSign className="w-5 h-5" />
          </button>
          <button
            onClick={() => onRequestCall('video')}
            className="p-3 bg-neo-pink text-white rounded-full border-2 border-black"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="flex-1 md:flex-none md:w-80 bg-zinc-900/50 flex flex-col min-h-0 relative">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 opacity-50">
            <MessageCircle className="w-4 h-4 text-white" />
            <span className="text-white font-bold uppercase text-[10px] tracking-widest">Chat</span>
          </div>
        </div>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 touch-pan-y"
          style={{ overscrollBehavior: 'contain' }}
        >
          {messages.map(msg => (
            <div
              key={msg.id}
              className="px-1"
            >
              {msg.isTip && (
                <div className="flex items-center gap-1 mb-1 opacity-80">
                  <span className="text-neo-yellow text-[10px] font-black uppercase tracking-tighter">Tip +{msg.tipAmount}</span>
                </div>
              )}
              <p className="text-zinc-200 text-sm leading-snug">
                <span className="font-bold text-neo-pink/80 mr-1.5">{msg.from}</span>
                <span className="opacity-90">{msg.text}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Chat Input - Anchored at bottom */}
        <div className="p-4 border-t-2 border-zinc-800 bg-zinc-900 z-10 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Say something..."
              className="flex-1 bg-zinc-800 text-white px-3 py-2 text-sm outline-none border-2 border-transparent focus:border-neo-green"
            />
            <button
              onClick={sendMessage}
              className="bg-neo-green text-black px-4 py-2 font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-[600] bg-black/80 flex items-center justify-center p-6">
          <div className="bg-white border-4 border-black p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black uppercase mb-4">Send Tip</h3>
            <p className="text-sm text-zinc-600 mb-4">Your balance: {userBalance} TKN</p>

            <div className="flex gap-2 mb-4">
              {[10, 50, 100, 500].map(amount => (
                <button
                  key={amount}
                  onClick={() => setTipAmount(amount)}
                  className={`flex-1 py-2 border-2 border-black font-black text-sm ${tipAmount === amount ? 'bg-neo-yellow' : 'bg-white'}`}
                >
                  {amount}
                </button>
              ))}
            </div>

            <input
              type="number"
              value={tipAmount}
              onChange={(e) => setTipAmount(Number(e.target.value))}
              className="w-full border-4 border-black p-3 text-center text-2xl font-black mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowTipModal(false)}
                className="flex-1 py-3 border-2 border-black font-black"
              >
                Cancel
              </button>
              <button
                onClick={sendTip}
                disabled={tipAmount <= 0 || tipAmount > userBalance}
                className="flex-1 py-3 bg-neo-green border-2 border-black font-black disabled:opacity-50"
              >
                Send {tipAmount} TKN
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
      `}</style>
    </div>
  );
}
