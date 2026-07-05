'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Zap, Users, Copy, Check, LogOut, Mic, Video, Radio, X,
  Sparkles, Link2, ArrowRight
} from 'lucide-react';
import { AblyProvider, useAbly } from '@/app/lib/ably';
import SharedOmniPad from '@/app/components/SharedOmniPad';

const CallStage = dynamic(() => import('@/app/components/SuperCall/CallStage'), { ssr: false });

interface TalkTimeClientProps {
  roomId: string;
  isHost: boolean;
  hostUsername: string;
  sessionTitle: string;
  creatorUsername: string;
}

// Inner component — needs Ably context
function TalkTimeRoom({
  roomId, isHost, sessionTitle, creatorUsername, participantName
}: TalkTimeClientProps & { participantName: string }) {
  const { publish, subscribe } = useAbly();
  const [peerCount, setPeerCount] = useState(isHost ? 1 : 1);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [callType] = useState<'audio' | 'video'>('video');

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/talktime/${roomId}`
    : '';

  // Session timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert(inviteUrl);
    }
  };

  const handleLeave = () => {
    setIsEnded(true);
    setTimeout(() => { window.location.href = '/'; }, 1500);
  };

  if (isEnded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans text-foreground">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">That was a great TalkTime.</h2>
          <p className="text-muted text-sm">Returning to Supertime...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">

      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[60%] bg-violet-600/8 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[60%] bg-rose-500/6 blur-[140px] rounded-full" />
      </div>

      {/* TOP BAR */}
      <header className="relative z-50 flex items-center justify-between px-5 py-3 bg-background/70 backdrop-blur-xl border-b border-border/50">

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-surface border border-border rounded-lg flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-yellow-500 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">{sessionTitle}</span>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Live</span>
                </div>
              </div>
              <p className="text-[10px] text-muted font-medium">{formatTime(elapsed)} · with {creatorUsername}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Share invite button */}
          <button
            onClick={copyInvite}
            className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Invite Link'}
          </button>

          {/* Leave */}
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">

        {/* LEFT — Video/Audio Call */}
        <div className="lg:w-[42%] flex-shrink-0 flex flex-col bg-black relative min-h-[280px] lg:min-h-0">
          {/* Podcast-style overlay badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="text-[11px] font-bold text-white/90 tracking-wide">ON AIR</span>
          </div>
          <CallStage
            channelName={roomId}
            uid={isHost ? `host-${creatorUsername}` : `guest-${participantName}-${Date.now()}`}
            type={callType}
            isCreator={isHost}
            onDisconnect={handleLeave}
            onPeerJoined={() => setPeerCount(2)}
            onPeerLeft={() => setPeerCount(1)}
          />
        </div>

        {/* DIVIDER — only on desktop */}
        <div className="hidden lg:block w-px bg-border/50 flex-shrink-0" />

        {/* RIGHT — Shared Pad */}
        <div className="flex-1 flex flex-col min-h-0 p-4 lg:p-6">
          <div className="flex-1 min-h-0">
            <SharedOmniPad
              roomId={roomId}
              participantName={participantName}
              isHost={isHost}
              publish={publish}
              subscribe={subscribe}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// Guest name gate — shown to non-hosts before entering
function GuestNameGate({
  sessionTitle,
  creatorUsername,
  onConfirm,
}: {
  sessionTitle: string;
  creatorUsername: string;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/8 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-rose-500/6 blur-[160px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-surface/80 backdrop-blur-2xl border border-border/70 rounded-3xl p-8 shadow-2xl space-y-8">

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                <Radio className="w-8 h-8 text-violet-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-violet-400 px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-full">TalkTime</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight mt-2">{sessionTitle}</h1>
              <p className="text-sm text-muted mt-1">
                <span className="font-medium text-foreground">{creatorUsername}</span> is waiting for you
              </p>
            </div>
          </div>

          {/* Name input */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
              What should we call you?
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
              placeholder="Your name..."
              autoFocus
              maxLength={32}
              className="w-full bg-background/60 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 transition-all text-sm font-medium"
            />
          </div>

          {/* Join button */}
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-violet-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide"
          >
            <Sparkles className="w-4 h-4" />
            Join the TalkTime
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-muted">
            No account needed · Your microphone & camera will be requested
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Root export — handles both host (direct entry) and guest (name gate)
export default function TalkTimeClient({
  roomId,
  isHost,
  hostUsername,
  sessionTitle,
  creatorUsername,
}: TalkTimeClientProps) {
  const [participantName, setParticipantName] = useState<string | null>(
    isHost ? hostUsername : null
  );

  if (!participantName) {
    return (
      <GuestNameGate
        sessionTitle={sessionTitle}
        creatorUsername={creatorUsername}
        onConfirm={name => setParticipantName(name)}
      />
    );
  }

  const ablyClientId = `talktime-${isHost ? 'host' : 'guest'}-${participantName.toLowerCase().replace(/\s+/g, '-')}-${roomId.slice(-6)}`;

  return (
    <AblyProvider clientId={ablyClientId}>
      <TalkTimeRoom
        roomId={roomId}
        isHost={isHost}
        hostUsername={hostUsername}
        sessionTitle={sessionTitle}
        creatorUsername={creatorUsername}
        participantName={participantName}
      />
    </AblyProvider>
  );
}
