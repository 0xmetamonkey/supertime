'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Zap, MessageSquare, PhoneOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useChatConnection, type ChatUser } from './useChatConnection';
import { getProfileImage } from '../../../actions';

interface ActiveChatWindowProps {
  user: ChatUser;
  recipient: string;
  balance?: number;
  onBack?: () => void;
}

export default function ActiveChatWindow({ user, recipient, balance = 0, onBack }: ActiveChatWindowProps) {
  const chat = useChatConnection(user, recipient);

  // ── Call State ──
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [callError, setCallError] = useState('');
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const [requiredRate, setRequiredRate] = useState(0);
  const SuperCallRef = useRef<any>(null);

  const [recipientImage, setRecipientImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!recipient) return;
    setRecipientImage(undefined);
    fetch(`/api/chat/inbox?username=${encodeURIComponent(user.username)}`)
      .then(res => res.json())
      .then(data => {
        const conv = data.conversations?.find((c: any) => c.with.toLowerCase() === recipient.toLowerCase());
        if (conv?.profileImage) {
          setRecipientImage(conv.profileImage);
        } else {
          getProfileImage(recipient).then(img => {
            if (img) setRecipientImage(img);
          });
        }
      })
      .catch(() => {
        getProfileImage(recipient).then(img => {
          if (img) setRecipientImage(img);
        });
      });
  }, [recipient, user.username]);

  // Lazy-load SuperCall component
  useEffect(() => {
    if (isCalling && !SuperCallRef.current) {
      import('../../SuperCall').then((mod) => {
        SuperCallRef.current = mod.default;
        // Force re-render
        setActiveChannelName((prev) => prev);
      });
    }
  }, [isCalling]);

  // Call duration timer
  useEffect(() => {
    if (!isCalling || !isPeerConnected) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCalling, isPeerConnected]);

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showCallError = (msg: string) => {
    setCallError(msg);
    setTimeout(() => setCallError(''), 4000);
  };

  const handleStartCall = useCallback(async (type: 'audio' | 'video') => {
    if (isCalling) return;

    try {
      // 1. Fetch recipient's rates
      const rateRes = await fetch(`/api/user/rates?username=${recipient}`);
      let reqRate = type === 'video' ? 100 : 50; // Fallback defaults
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        reqRate = type === 'video' ? rateData.videoRate : rateData.audioRate;
      }

      // 2. Check balance
      if (balance < reqRate) {
        setRequiredRate(reqRate);
        setShowLowBalanceModal(true);
        return;
      }

      // Use the signal API to initiate the call (same as CreatorClient fallback path)
      const response = await fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'call',
          from: user.username,
          fromName: user.username,
          to: recipient,
          type,
        }),
      });
      const data = await response.json();

      if (data.success && data.channelName) {
        setCallType(type);
        setActiveChannelName(data.channelName);
        setIsCalling(true);
        setCallDuration(0);
        setIsPeerConnected(false);
      } else {
        showCallError('Failed to connect. Please try again.');
      }
    } catch (e) {
      console.error('[Chat Call] Error initiating call:', e);
      showCallError('Connection error. Please try again.');
    }
  }, [isCalling, user.username, recipient, balance]);

  const handleEndCall = useCallback(async () => {
    setIsCalling(false);
    setActiveChannelName(null);
    setIsPeerConnected(false);
    setCallDuration(0);
    setCallType(null);

    try {
      await fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          from: user.username,
          to: recipient,
        }),
      });
    } catch (e) {
      console.error('[Chat Call] Error ending call:', e);
    }
  }, [user.username, recipient]);

  // Auto-scroll on new messages
  useEffect(() => {
    chat.bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const SuperCallComponent = SuperCallRef.current;

  return (
    <>
      <div className="chat-active-panel">
        {/* Header */}
        <ChatHeader
          recipientName={recipient}
          recipientImage={recipientImage}
          isOnline={chat.recipientOnline}
          onBack={onBack}
          onAudioCall={() => handleStartCall('audio')}
          onVideoCall={() => handleStartCall('video')}
          isCallActive={isCalling}
        />

        {/* Call Error Toast */}
        <AnimatePresence>
          {callError && (
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 bg-red-500/90 text-white rounded-lg text-sm shadow-lg font-medium backdrop-blur-sm"
            >
              {callError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 chat-scroll">
          {chat.loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-10 h-10 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto mb-3" />
                <p className="font-medium text-muted text-xs">Loading messages...</p>
              </div>
            </div>
          ) : chat.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-xs">
                <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-1">Start a conversation</h3>
                <p className="text-muted text-sm">
                  Say hi to @{recipient}! Messages are private between you two.
                </p>
              </div>
            </div>
          ) : (
            <>
              {chat.groupedMessages.map((group, gi) => (
                <div key={gi}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 mb-4 mt-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="font-medium text-[11px] text-muted px-2 uppercase tracking-wider">
                      {group.date}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-1">
                    {group.messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMe={msg.from === user.username}
                        formatTime={chat.formatTime}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div ref={chat.bottomRef} />
            </>
          )}
        </div>

        {/* Typing Indicator */}
        {chat.typingUsers.size > 0 && (
          <div className="px-5 py-1.5 shrink-0">
            <p className="font-medium text-xs text-muted animate-pulse">
              {Array.from(chat.typingUsers.keys()).join(', ')}{' '}
              {chat.typingUsers.size === 1 ? 'is' : 'are'} typing...
            </p>
          </div>
        )}

        {/* Input */}
        <ChatInput
          input={chat.input}
          onInputChange={chat.handleInputChange}
          onSend={chat.sendMessage}
          onAttachFile={chat.sendMediaMessage}
          mentions={chat.mentions}
          setMentions={chat.setMentions}
          selectMention={chat.selectMention}
        />
      </div>

      {/* ── SuperCall Overlay ── */}
      {isCalling && activeChannelName && (
        <div className="fixed inset-0 z-[500] bg-zinc-950">
          {/* Call HUD */}
          <div className="absolute top-6 left-6 right-6 z-[510] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl">
                <span className="text-white text-sm font-black tabular-nums">
                  {isPeerConnected ? formatCallTime(callDuration) : 'Calling...'}
                </span>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl">
                <span className="text-white/70 text-sm font-medium">
                  {callType === 'video' ? '📹' : '🎙️'} @{recipient}
                </span>
              </div>
            </div>
            <button
              onClick={handleEndCall}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              End
            </button>
          </div>

          {/* Lazy-loaded SuperCall */}
          {SuperCallComponent ? (
            <SuperCallComponent
              key={activeChannelName}
              channelName={activeChannelName}
              uid={`caller-${user.id}`}
              type={callType!}
              isCreator={false}
              onDisconnect={handleEndCall}
              onPeerJoined={() => setIsPeerConnected(true)}
              onPeerLeft={() => setIsPeerConnected(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/60 text-sm font-medium">Connecting call...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Low Balance Modal ── */}
      <AnimatePresence>
        {showLowBalanceModal && (
          <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Low Balance</h3>
              <p className="text-sm text-muted mb-6">
                You need at least <strong className="text-foreground">{requiredRate} tokens</strong> to start this call. Your current balance is {balance} tokens.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLowBalanceModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm border border-border bg-background hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <a
                  href="/dashboard?tab=wallet"
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  Top-up Tokens
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
