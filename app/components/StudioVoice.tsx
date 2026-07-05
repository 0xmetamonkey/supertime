'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

// ── Scripted lines ────────────────────────────────────────────────────────────
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
};

const VOICE_OPT_IN_KEY = 'supertime:voice:opted-in';

// ── Waveform bars ─────────────────────────────────────────────────────────────
function VoiceWaveform({ active }: { active: boolean }) {
  const bars = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.4, 0.7];
  return (
    <div className="flex items-center gap-[3px] h-4">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full bg-foreground"
          animate={active ? {
            scaleY: [h * 0.3, h, h * 0.5, h * 0.9, h * 0.2, h],
            opacity: [0.3, 0.8, 0.5, 0.8, 0.4, 0.8],
          } : { scaleY: 0.15, opacity: 0.15 }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
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
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      title="The Voice"
      className="relative w-10 h-10 rounded-full flex items-center justify-center focus:outline-none"
      aria-label="Open The Voice guide"
    >
      {/* Speaking pulse ring */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            key="glow"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.4, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-foreground/20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Core orb — uses design system only */}
      <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 ${
        isOpen
          ? 'bg-foreground border-foreground'
          : 'bg-surface border-border hover:border-foreground'
      }`}>
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-background' : 'bg-foreground'}`}
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
  const [optedIn, setOptedIn]         = useState<boolean | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [isOpen, setIsOpen]           = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isMuted, setIsMuted]         = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [messages, setMessages]       = useState<{ role: 'voice' | 'user'; text: string }[]>([]);

  const synthRef             = useRef<SpeechSynthesis | null>(null);
  const recognitionRef       = useRef<any>(null);
  const utteranceRef         = useRef<SpeechSynthesisUtterance | null>(null);
  const prevLiveRef          = useRef(isLive);
  const prevStatusRef        = useRef(studioStatus);
  const hasGreetedRef        = useRef(false);
  const messagesEndRef       = useRef<HTMLDivElement>(null);
  const handleUserMessageRef = useRef<(text: string) => void>(() => {});

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    synthRef.current = window.speechSynthesis;

    const saved = localStorage.getItem(VOICE_OPT_IN_KEY);
    if (saved === 'true') setOptedIn(true);
    else if (saved === 'false') setOptedIn(false);
    else setOptedIn(null);

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

    return () => { synthRef.current?.cancel(); };
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

    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Aria')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.rate   = 0.88;
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
    if (optedIn === null) { setShowConsent(true); return; }
    if (optedIn === false) return;
    setIsOpen(true);
    if (!hasGreetedRef.current) {
      hasGreetedRef.current = true;
      const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      setTimeout(() => speak(greeting), 400);
    }
  }, [optedIn, speak]);

  // ── React to studio state changes ─────────────────────────────────────────
  useEffect(() => {
    if (!optedIn || !isOpen) return;
    if (isLive && !prevLiveRef.current) speak(STUDIO_CONTEXT_LINES.live);
    if (!isLive && prevLiveRef.current) speak("Stream's off. Good session.");
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

  // ── AI response ───────────────────────────────────────────────────────────
  const handleUserMessage = useCallback(async (userText: string) => {
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    try {
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, context: { isLive, studioStatus, username } }),
      });
      if (res.ok) { const data = await res.json(); speak(data.reply); return; }
    } catch {}
    const fallbacks = [
      "I hear you. Keep doing what you're doing.",
      "The studio's here whenever you need it.",
      "Stay in your zone. You've got this.",
    ];
    speak(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
  }, [isLive, studioStatus, username, speak]);

  useEffect(() => { handleUserMessageRef.current = handleUserMessage; }, [handleUserMessage]);

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
    setIsMuted(m => { if (!m) synthRef.current?.cancel(); return !m; });
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    setTranscript('');
    setIsListening(true);
    try { recognitionRef.current.start(); } catch {}
  };

  if (optedIn === false) return null;

  return (
    <>
      {/* ── Floating Orb ── */}
      <div className="relative">
        <VoiceOrb isSpeaking={isSpeaking} isOpen={isOpen} onClick={handleOpen} />
        {optedIn === null && !showConsent && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-muted bg-surface border border-border px-2 py-0.5 rounded-full pointer-events-none"
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
            className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-4 bg-background/60 backdrop-blur-md"
            onClick={e => { if (e.target === e.currentTarget) setShowConsent(false); }}
          >
            <motion.div
              initial={{ y: 40, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 40, scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-sm bg-surface border border-border rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-6">
                {/* Orb preview */}
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.25, 0.1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-foreground pointer-events-none"
                  />
                  <div className="relative w-14 h-14 rounded-full bg-foreground border border-border flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-background" />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-2">New in Studio</p>
                  <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">Meet The Voice</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    An AI guide that lives in your studio — helps you navigate, reacts to your sessions,
                    and keeps you in the zone. Stays on every time you come in.
                  </p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={declineVoice}
                    className="flex-1 py-3 rounded-2xl border border-border text-muted text-sm font-medium hover:text-foreground hover:border-foreground transition-all"
                  >
                    Not now
                  </button>
                  <button
                    onClick={acceptVoice}
                    className="flex-[2] py-3 rounded-2xl bg-foreground text-background text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all"
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
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed bottom-24 right-4 md:right-8 z-[4000] w-[calc(100vw-2rem)] max-w-sm"
          >
            <div className="bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-foreground border border-border flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-background" />
                    </div>
                    {isSpeaking && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-foreground/30"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold tracking-tight">The Voice</p>
                    <VoiceWaveform active={isSpeaking} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isMuted ? 'text-foreground bg-surface' : 'text-muted hover:text-foreground'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-52 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted text-xs text-center">Tap the mic to speak, or just listen.</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug border ${
                      msg.role === 'voice'
                        ? 'bg-background border-border text-foreground rounded-tl-sm'
                        : 'bg-surface border-border text-muted rounded-tr-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-4 pb-4 pt-2 border-t border-border">
                <div className="flex items-center gap-2 bg-background border border-border rounded-2xl px-4 py-2.5 focus-within:border-foreground transition-all">
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
                    className="flex-1 bg-transparent text-foreground text-xs outline-none placeholder:text-muted"
                  />
                  <button
                    onClick={startListening}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                      isListening
                        ? 'bg-foreground text-background'
                        : 'text-muted hover:text-foreground'
                    }`}
                    title="Speak"
                  >
                    {isListening ? (
                      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
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
