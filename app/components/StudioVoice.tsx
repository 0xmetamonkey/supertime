'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

// ── Scripted lines (Gemini fallback & pre-warm) ──────────────────────────────
const GREETINGS = [
  "Hey, good to see you in the studio.",
  "You're in. Let's make something.",
  "Welcome back. The studio's yours.",
];

const STUDIO_CONTEXT_LINES: Record<string, string> = {
  idle:     "Everything's set. Go live whenever you're ready, or just chill here.",
  live:     "You're live right now. The audience is watching — stay focused.",
  onTheLine:"Your calls are open. Someone could knock any moment.",
  chilling: "Chilling mode is on. You're visible but not taking calls. Perfect for a breather.",
  offline:  "You're offline. No one can reach you right now. Rest up.",
  callIncoming: "Someone's knocking. Tap 'on the line' to let them in.",
};

const VOICE_OPT_IN_KEY = 'supertime:voice:opted-in';
const VOICE_NAME_KEY   = 'supertime:voice:name';

// ── Waveform bars (pure CSS animation) ───────────────────────────────────────
function VoiceWaveform({ active }: { active: boolean }) {
  const bars = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.4, 0.7];
  return (
    <div className="flex items-center gap-[3px] h-5">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-violet-400"
          animate={active ? {
            scaleY: [h * 0.3, h, h * 0.5, h * 0.9, h * 0.2, h],
            opacity: [0.5, 1, 0.7, 1, 0.6, 1],
          } : { scaleY: 0.15, opacity: 0.2 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
          style={{ height: '100%', originY: 1 }}
        />
      ))}
    </div>
  );
}

// ── Orb ───────────────────────────────────────────────────────────────────────
function VoiceOrb({ isSpeaking, onClick, isOpen }: {
  isSpeaking: boolean;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title="The Voice"
      className="relative w-12 h-12 rounded-full flex items-center justify-center focus:outline-none"
      aria-label="Open The Voice guide"
    >
      {/* Outer glow ring when speaking */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            key="glow"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: [1, 1.35, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-violet-500/30 blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Core orb */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
          isOpen
            ? 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 shadow-violet-500/40'
            : 'bg-gradient-to-br from-violet-400/80 via-purple-500/80 to-indigo-500/80 shadow-violet-400/20'
        }`}
        style={{
          boxShadow: isSpeaking
            ? '0 0 20px rgba(139,92,246,0.6), 0 0 40px rgba(139,92,246,0.3)'
            : undefined,
        }}
      >
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-3 h-3 rounded-full bg-white/90"
        />
      </div>
    </motion.button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface StudioVoiceProps {
  username: string;
  isLive?: boolean;
  studioStatus?: 'online' | 'chilling' | 'offline';
}

export default function StudioVoice({ username, isLive, studioStatus }: StudioVoiceProps) {
  const [optedIn, setOptedIn]         = useState<boolean | null>(null); // null = loading
  const [showConsent, setShowConsent] = useState(false);
  const [isOpen, setIsOpen]           = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isMuted, setIsMuted]         = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [messages, setMessages]       = useState<{ role: 'voice' | 'user'; text: string }[]>([]);

  const synthRef      = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const utteranceRef  = useRef<SpeechSynthesisUtterance | null>(null);
  const prevLiveRef   = useRef(isLive);
  const prevStatusRef = useRef(studioStatus);
  const hasGreetedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handleUserMessageRef = useRef<(text: string) => void>(() => {});

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    synthRef.current = window.speechSynthesis;

    // Load opt-in state
    const saved = localStorage.getItem(VOICE_OPT_IN_KEY);
    if (saved === 'true') {
      setOptedIn(true);
    } else if (saved === 'false') {
      setOptedIn(false);
    } else {
      setOptedIn(null); // first time
    }

    // Init STT
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (e: any) => {
        const said = e.results[0][0].transcript;
        setTranscript(said);
        setIsListening(false);
        handleUserMessageRef.current(said);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend   = () => setIsListening(false);
      recognitionRef.current = rec;
    }

    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  // Scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Speak ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!synthRef.current || isMuted) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Pick the calmest available voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Aria') ||
      v.name.includes('Female')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.rate   = 0.88;  // slightly slower = calmer
    utterance.pitch  = 1.05;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setMessages(prev => [...prev, { role: 'voice', text }]);
    synthRef.current.speak(utterance);
  }, [isMuted]);

  // ── Open → greet ──────────────────────────────────────────────────────────
  const handleOpen = useCallback(() => {
    if (optedIn === null) {
      setShowConsent(true);
      return;
    }
    if (optedIn === false) return;

    setIsOpen(true);
    if (!hasGreetedRef.current) {
      hasGreetedRef.current = true;
      const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      setTimeout(() => speak(greeting), 400);
    }
  }, [optedIn, speak]);

  // ── Contextual reactions to studio state ──────────────────────────────────
  useEffect(() => {
    if (!optedIn || !isOpen) return;

    // Went live
    if (isLive && !prevLiveRef.current) {
      speak(STUDIO_CONTEXT_LINES.live);
    }
    // Ended stream
    if (!isLive && prevLiveRef.current) {
      speak("Stream's off. Good session.");
    }
    prevLiveRef.current = isLive;
  }, [isLive, optedIn, isOpen, speak]);

  useEffect(() => {
    if (!optedIn || !isOpen) return;
    if (studioStatus !== prevStatusRef.current) {
      const line = STUDIO_CONTEXT_LINES[studioStatus || 'idle'];
      if (line) speak(line);
    }
    prevStatusRef.current = studioStatus;
  }, [studioStatus, optedIn, isOpen, speak]);

  // ── AI response (Gemini or scripted fallback) ─────────────────────────────
  const handleUserMessage = useCallback(async (userText: string) => {
    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    try {
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: { isLive, studioStatus, username },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        speak(data.reply);
        return;
      }
    } catch {
      // fallback below
    }

    // Scripted fallback
    const fallbacks = [
      "I hear you. Keep doing what you're doing.",
      "The studio's here whenever you need it.",
      "Stay in your zone. You've got this.",
    ];
    speak(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
  }, [isLive, studioStatus, username, speak]);

  // Keep ref in sync so STT closure always uses latest version
  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage;
  }, [handleUserMessage]);


  // ── Consent handlers ───────────────────────────────────────────────────────
  const acceptVoice = () => {
    localStorage.setItem(VOICE_OPT_IN_KEY, 'true');
    setOptedIn(true);
    setShowConsent(false);
    setIsOpen(true);
    hasGreetedRef.current = true;
    setTimeout(() => speak("Hey. I'm The Voice. I'll guide you through the studio whenever you need me."), 500);
  };

  const declineVoice = () => {
    localStorage.setItem(VOICE_OPT_IN_KEY, 'false');
    setOptedIn(false);
    setShowConsent(false);
  };

  const toggleMute = () => {
    setIsMuted(m => {
      if (!m) synthRef.current?.cancel();
      return !m;
    });
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    setTranscript('');
    setIsListening(true);
    try { recognitionRef.current.start(); } catch {}
  };

  // ── If declined, render nothing ───────────────────────────────────────────
  if (optedIn === false) return null;

  return (
    <>
      {/* ── Floating Orb ── */}
      <div className="relative">
        <VoiceOrb
          isSpeaking={isSpeaking}
          isOpen={isOpen}
          onClick={handleOpen}
        />
        {/* "The Voice" label on first visit hint */}
        {optedIn === null && !showConsent && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-violet-500 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full pointer-events-none"
          >
            The Voice
          </motion.div>
        )}
      </div>

      {/* ── Consent Modal ── */}
      <AnimatePresence>
        {showConsent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={e => { if (e.target === e.currentTarget) { setShowConsent(false); } }}
          >
            <motion.div
              initial={{ y: 40, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 40, scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-sm bg-[#0f0d18] border border-violet-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Ambient */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-violet-600/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-1/4 -left-1/4 w-2/3 h-2/3 bg-indigo-600/10 blur-[80px] rounded-full" />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                {/* Animated orb preview */}
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-violet-500/30 blur-lg"
                  />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/40">
                    <div className="w-5 h-5 rounded-full bg-white/90" />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400 mb-2">New in Studio</p>
                  <h3 className="text-xl font-bold text-white tracking-tight mb-2">Meet The Voice</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    An AI guide that lives in your studio — helps you navigate, reacts to your sessions,
                    and keeps you in the zone. Stays on every time you come in.
                  </p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={declineVoice}
                    className="flex-1 py-3 rounded-2xl border border-white/10 text-white/40 text-sm font-medium hover:text-white/60 transition-colors"
                  >
                    Not now
                  </button>
                  <button
                    onClick={acceptVoice}
                    className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-violet-500/30 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    Let's talk
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Voice Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed bottom-24 right-4 md:right-8 z-[4000] w-[calc(100vw-2rem)] max-w-sm"
          >
            <div className="bg-[#0d0b16]/95 backdrop-blur-3xl border border-violet-500/20 rounded-3xl shadow-2xl overflow-hidden"
              style={{ boxShadow: '0 0 60px rgba(139,92,246,0.12), 0 20px 60px rgba(0,0,0,0.5)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/90" />
                    </div>
                    {isSpeaking && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-violet-500/50"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold tracking-tight">The Voice</p>
                    <div className="flex items-center gap-1.5">
                      <VoiceWaveform active={isSpeaking} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isMuted ? 'text-rose-400 bg-rose-400/10' : 'text-white/40 hover:text-white/70'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-52 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/20 text-xs text-center">
                      Tap the mic to speak, or just listen.
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${
                      msg.role === 'voice'
                        ? 'bg-violet-500/15 border border-violet-500/20 text-white/80 rounded-tl-sm'
                        : 'bg-white/8 border border-white/10 text-white/60 rounded-tr-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-4 pb-4 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-2.5 border border-white/8">
                  <input
                    type="text"
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && transcript.trim()) {
                        handleUserMessage(transcript.trim());
                        setTranscript('');
                      }
                    }}
                    placeholder="Say something or type..."
                    className="flex-1 bg-transparent text-white/70 text-xs outline-none placeholder:text-white/20"
                  />
                  <button
                    onClick={startListening}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                      isListening
                        ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                        : 'text-violet-400/60 hover:text-violet-400 hover:bg-violet-400/10'
                    }`}
                    title="Speak"
                  >
                    {isListening ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      >
                        <MicOff className="w-3.5 h-3.5" />
                      </motion.div>
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
