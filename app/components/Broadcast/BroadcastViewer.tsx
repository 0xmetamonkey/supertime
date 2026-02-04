'use client';

import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IRemoteVideoTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { MessageCircle, Send, DollarSign, Phone, Users, X } from 'lucide-react';

interface BroadcastViewerProps {
  channelName: string;
  uid: string;
  creatorUsername: string;
  onLeave: () => void;
  onRequestCall: (type: 'audio' | 'video') => void;
  userBalance: number;
}

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  isTip?: boolean;
  tipAmount?: number;
  timestamp: number;
}

export default function BroadcastViewer({
  channelName,
  uid,
  creatorUsername,
  onLeave,
  onRequestCall,
  userBalance
}: BroadcastViewerProps) {
  const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: 'live', codec: 'vp8', role: 'audience' }));
  const [remoteVideo, setRemoteVideo] = useState<IRemoteVideoTrack | null>(null);
  const [remoteAudio, setRemoteAudio] = useState<IRemoteAudioTrack | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(50);

  const videoRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages
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

  // Send chat message via API
  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const text = chatInput;
    setChatInput('');

    // Add locally immediately for responsiveness
    const localMsg = {
      id: Math.random().toString(36).slice(2),
      from: 'You',
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, localMsg]);

    // Send to API
    try {
      await fetch('/api/broadcast/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName,
          message: text,
          from: uid.startsWith('guest-') ? `Guest-${uid.slice(6, 10)}` : 'Viewer'
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
      // TODO: Notify creator via Ably
    } catch (e) {
      console.error('Tip failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col md:flex-row">
      {/* Video Area */}
      <div className="flex-1 relative">
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
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <button
            onClick={() => setShowTipModal(true)}
            className="bg-neo-yellow text-black px-4 py-2 font-black text-sm flex items-center gap-2 border-2 border-black"
          >
            <DollarSign className="w-4 h-4" /> TIP
          </button>
          <button
            onClick={() => onRequestCall('video')}
            className="bg-neo-pink text-white px-4 py-2 font-black text-sm flex items-center gap-2 border-2 border-black"
          >
            <Phone className="w-4 h-4" /> 1:1 CALL
          </button>
        </div>
      </div>

      {/* Chat Sidebar (Desktop) */}
      <div className="hidden md:flex w-80 bg-zinc-900 border-l-4 border-black flex-col">
        <div className="p-4 border-b-2 border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-neo-green" />
            <span className="text-white font-black uppercase text-sm">Live Chat</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
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
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t-2 border-zinc-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Say something..."
              className="flex-1 bg-zinc-800 text-white px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={sendMessage}
              className="bg-neo-green text-black px-4 py-2"
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
    </div>
  );
}
