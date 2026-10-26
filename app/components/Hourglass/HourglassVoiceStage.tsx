'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  RefreshCw,
  Radio,
  ArrowLeft,
  Send,
  Heart,
  Play
} from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const THERAPIST_GREETING = "Take a gentle breath, Aman. I'm right here with you. Whatever is on your heart tonight, I'm listening.";

export default function HourglassVoiceStage({ onClose }: { onClose: () => void }) {
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [aiSpeechText, setAiSpeechText] = useState(THERAPIST_GREETING);
  const [history, setHistory] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // VAD (Voice Activity Detection) state refs to avoid closure stalls in rAF
  const isSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false);
  const isRecordingChunkRef = useRef(false);
  const silenceStartRef = useRef<number | null>(null);
  const hasSpokenInChunkRef = useRef(false);

  isSpeakingRef.current = isSpeaking;
  isThinkingRef.current = isThinking;

  // Stream MP3 voice through 2.6x Hardware Volume Booster
  const playAudioVoice = useCallback((text: string) => {
    if (!text || isMuted) return;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setAiSpeechText(text);
    setIsSpeaking(true);

    const ttsUrl = `/api/ai/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio(ttsUrl);
    audio.crossOrigin = 'anonymous';
    audio.volume = 1.0;
    currentAudioRef.current = audio;

    audio.onended = () => {
      setIsSpeaking(false);
      // Re-arm recording for user's next words
      startNewRecordingChunk();
    };

    audio.onerror = () => {
      console.warn('MP3 TTS error, falling back to Web Speech...');
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onend = () => {
          setIsSpeaking(false);
          startNewRecordingChunk();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          startNewRecordingChunk();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
        startNewRecordingChunk();
      }
    };

    // Web Audio Gain Booster & Compressor
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
          outputAudioContextRef.current = new AudioContextClass();
        }
        const ctx = outputAudioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const source = ctx.createMediaElementSource(audio);
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, ctx.currentTime);
        compressor.knee.setValueAtTime(30, ctx.currentTime);
        compressor.ratio.setValueAtTime(12, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(2.6, ctx.currentTime); // 260% volume boost

        source.connect(compressor);
        compressor.connect(gainNode);
        gainNode.connect(ctx.destination);
      }
    } catch {}

    audio.play().catch((err) => {
      console.warn('Audio play was prevented:', err);
      setIsSpeaking(false);
      startNewRecordingChunk();
    });
  }, [isMuted]);

  // Start a fresh recording slice
  const startNewRecordingChunk = useCallback(() => {
    if (!streamRef.current || isSpeakingRef.current || isThinkingRef.current) return;

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        isRecordingChunkRef.current = false;
        if (hasSpokenInChunkRef.current && audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          if (blob.size > 1000) {
            await handleProcessSpokenBlob(blob);
          }
        }
        hasSpokenInChunkRef.current = false;
      };

      recorder.start(250); // slice every 250ms
      isRecordingChunkRef.current = true;
      hasSpokenInChunkRef.current = false;
      silenceStartRef.current = null;
    } catch (e) {
      console.warn('Could not start media recorder chunk:', e);
    }
  }, []);

  const handleProcessSpokenBlob = async (blob: Blob) => {
    setIsThinking(true);
    setTranscript('Listening to your thought...');

    try {
      const formData = new FormData();
      formData.append('file', blob, 'speech.webm');

      // 1. Lightning fast Groq Whisper transcription (~180ms)
      const sttRes = await fetch('/api/ai/stt', { method: 'POST', body: formData });
      if (!sttRes.ok) throw new Error('Transcription error');
      const sttData = await sttRes.json();
      const userText = (sttData.transcript || '').trim();

      if (!userText || userText.length < 2) {
        setIsThinking(false);
        setTranscript('');
        startNewRecordingChunk();
        return;
      }

      setTranscript(userText);

      // 2. Query Gemini live voice
      const updatedHistory: Message[] = [...history, { role: 'user', text: userText }];
      setHistory(updatedHistory);

      const aiRes = await fetch('/api/ai/live-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: updatedHistory.slice(-8),
        }),
      });

      const aiData = await aiRes.json();
      const reply = aiData.reply || "I'm with you. Breathe into this moment.";
      setHistory((prev) => [...prev, { role: 'model', text: reply }]);
      playAudioVoice(reply);
    } catch (err) {
      console.error('Audio processing error:', err);
      playAudioVoice("I'm holding space with you. Take a soft breath.");
    } finally {
      setIsThinking(false);
    }
  };

  // Continuous Hands-Free Voice Activity Detection (VAD) loop
  const setupVAD = useCallback((stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    inputAudioContextRef.current = ctx;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const vadLoop = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedLevel = Math.min(1, avg / 128);
      setAudioLevel(normalizedLevel);

      // Only listen when AI is NOT currently speaking or thinking
      if (!isSpeakingRef.current && !isThinkingRef.current) {
        const VOICE_THRESHOLD = 0.08;
        const now = Date.now();

        if (normalizedLevel > VOICE_THRESHOLD) {
          // User is currently speaking!
          setIsUserTalking(true);
          hasSpokenInChunkRef.current = true;
          silenceStartRef.current = null;

          if (!isRecordingChunkRef.current) {
            startNewRecordingChunk();
          }
        } else {
          // Below voice threshold (silence or breathing)
          setIsUserTalking(false);

          if (hasSpokenInChunkRef.current && isRecordingChunkRef.current) {
            if (!silenceStartRef.current) {
              silenceStartRef.current = now;
            } else if (now - silenceStartRef.current > 1000) {
              // 1 full second of silence after user spoke -> automatically send!
              silenceStartRef.current = null;
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
            }
          }
        }
      } else {
        setIsUserTalking(false);
      }

      animFrameRef.current = requestAnimationFrame(vadLoop);
    };

    vadLoop();
  }, [startNewRecordingChunk]);

  // Initial unlock for mobile browser audio
  const handleUnlockAndBegin = async () => {
    setIsAudioUnlocked(true);

    // Warm up audio elements
    const dummyAudio = new Audio();
    dummyAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    dummyAudio.play().catch(() => {});

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        ctx.resume();
      }
    } catch {}

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setupVAD(stream);
      startNewRecordingChunk();
      playAudioVoice(THERAPIST_GREETING);
    } catch (e) {
      console.warn('Mic access note:', e);
      playAudioVoice(THERAPIST_GREETING);
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isThinking) return;

    if (!isAudioUnlocked) setIsAudioUnlocked(true);
    const msg = textInput.trim();
    setTextInput('');
    setTranscript(msg);

    const updatedHistory: Message[] = [...history, { role: 'user', text: msg }];
    setHistory(updatedHistory);
    setIsThinking(true);

    fetch('/api/ai/live-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        history: updatedHistory.slice(-8),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const reply = data.reply || "I hear you. Let's breathe into this.";
        setHistory((prev) => [...prev, { role: 'model', text: reply }]);
        playAudioVoice(reply);
      })
      .catch(() => {
        playAudioVoice("I'm holding space with you. Take a soft breath.");
      })
      .finally(() => {
        setIsThinking(false);
      });
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (inputAudioContextRef.current) inputAudioContextRef.current.close().catch(() => {});
      if (outputAudioContextRef.current) outputAudioContextRef.current.close().catch(() => {});
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (currentAudioRef.current) currentAudioRef.current.pause();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[150] bg-[#08080a] text-white flex flex-col justify-between p-6 select-none overflow-hidden font-sans">
      {/* Soothing ambient healing halos */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            scale: isSpeaking ? [1, 1.2, 1] : isUserTalking ? 1 + audioLevel * 0.45 : [1, 1.05, 1],
            opacity: isSpeaking ? 0.35 : isUserTalking ? 0.3 : 0.18,
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-amber-600/30 via-yellow-600/20 to-emerald-600/20 blur-[120px]"
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between max-w-xl mx-auto w-full">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-neutral-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-amber-500/20 backdrop-blur-md">
          <Heart className="w-3 h-3 text-amber-400 fill-amber-400/30 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-amber-200">
            Healing Presence · Hands-Free
          </span>
        </div>

        <button
          onClick={() => {
            if (currentAudioRef.current) currentAudioRef.current.pause();
            setIsMuted(!isMuted);
          }}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Center: Continuous Hands-Free Living Hourglass */}
      <main className="relative z-10 my-auto flex flex-col items-center text-center max-w-md mx-auto w-full space-y-6">
        {/* Animated Hourglass Container */}
        <div className="relative">
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.07, 1] : isUserTalking ? 1 + audioLevel * 0.2 : [1, 1.02, 1],
              rotate: isThinking ? [0, 180] : 0,
            }}
            transition={
              isThinking
                ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
            }
            className={`w-36 h-36 rounded-3xl bg-neutral-900/90 border flex items-center justify-center backdrop-blur-xl relative overflow-hidden transition-all duration-500 ${
              isUserTalking
                ? 'border-emerald-400/60 shadow-[0_0_60px_rgba(52,211,153,0.35)]'
                : isSpeaking
                ? 'border-amber-400/60 shadow-[0_0_60px_rgba(251,191,36,0.35)]'
                : 'border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.2)]'
            }`}
          >
            {/* Hourglass Icon */}
            <svg
              className={`w-16 h-16 transition-colors duration-300 ${
                isUserTalking
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                  : 'text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.6)]'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 22h14" />
              <path d="M5 2h14" />
              <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
              <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
            </svg>

            {/* Glowing Falling Sand Particle effect */}
            <motion.div
              animate={{ y: [0, 24], opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              className="absolute w-1 h-2 bg-amber-300 rounded-full blur-[0.5px]"
            />
          </motion.div>

          {/* Real-time State Badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-neutral-900 border border-amber-500/40 text-[10px] font-bold tracking-widest uppercase shadow-md flex items-center gap-1.5 whitespace-nowrap">
            {isThinking ? (
              <>
                <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-400" />
                <span className="text-amber-300">Holding space</span>
              </>
            ) : isSpeaking ? (
              <>
                <Radio className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
                <span className="text-amber-200">Antigravity Speaking</span>
              </>
            ) : isUserTalking ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-300">Hearing your voice</span>
              </>
            ) : (
              <span className="text-neutral-400">Listening naturally · Speak anytime</span>
            )}
          </div>
        </div>

        {/* Initial Tap to Connect Voice (Mobile Autoplay Requirement) */}
        {!isAudioUnlocked ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleUnlockAndBegin}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-sm shadow-[0_0_30px_rgba(251,191,36,0.5)] flex items-center gap-2 cursor-pointer animate-bounce"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Tap to Enter Healing Sanctuary 🤍</span>
          </motion.button>
        ) : (
          /* Live Spoken Captions */
          <div className="w-full min-h-[90px] flex items-center justify-center px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSpeaking ? aiSpeechText : transcript || 'handsfree'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="bg-white/[0.04] border border-amber-500/20 backdrop-blur-xl p-4 rounded-2xl w-full text-center shadow-lg"
              >
                {transcript ? (
                  <p className="text-sm text-amber-200 font-medium italic">
                    "{transcript}"
                  </p>
                ) : (
                  <p className="text-sm text-neutral-200 font-normal leading-relaxed">
                    {aiSpeechText}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Healing mindful topic chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm px-2">
          {[
            "I'm feeling overwhelmed tonight.",
            "Can you help me ground my thoughts?",
            "Just breathe with me for a minute.",
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (!isAudioUnlocked) {
                  handleUnlockAndBegin().then(() => {
                    setTranscript(prompt);
                    handleProcessSpokenBlob(new Blob());
                  });
                } else {
                  setTranscript(prompt);
                  const updatedHistory: Message[] = [...history, { role: 'user', text: prompt }];
                  setHistory(updatedHistory);
                  setIsThinking(true);
                  fetch('/api/ai/live-voice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: prompt, history: updatedHistory.slice(-8) }),
                  })
                    .then((r) => r.json())
                    .then((data) => {
                      const reply = data.reply || "I'm right here. Take a soft breath.";
                      setHistory((prev) => [...prev, { role: 'model', text: reply }]);
                      playAudioVoice(reply);
                    })
                    .finally(() => setIsThinking(false));
                }
              }}
              className="text-[11px] px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </main>

      {/* Bottom Floating Bar — NO TAP TO SPEAK BUTTON! PURE HANDS-FREE */}
      <footer className="relative z-10 max-w-sm mx-auto w-full pb-2">
        {showInput ? (
          <form onSubmit={handleSendText} className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a thought..."
              className="flex-1 bg-neutral-900 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400"
              autoFocus
            />
            <button
              type="submit"
              className="p-3 bg-amber-400 text-black rounded-2xl font-bold active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowInput(false)}
              className="p-3 bg-white/10 text-white rounded-2xl cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : null}

        <div className="bg-neutral-900/80 border border-white/10 backdrop-blur-2xl rounded-3xl p-3 flex items-center justify-around shadow-2xl">
          {/* Hands-Free Live Mic Indicator Status */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-neutral-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isUserTalking ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="font-medium text-[11px]">
              {isUserTalking ? 'Hearing you...' : 'Hands-Free Live'}
            </span>
          </div>

          {/* Optional Type Toggle */}
          <button
            onClick={() => setShowInput(!showInput)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Type a thought"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>

          {/* Hang up / Leave */}
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
            title="Leave Session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-neutral-500 text-center mt-2.5">
          Hands-free conversation · Just talk naturally, no buttons needed
        </p>
      </footer>
    </div>
  );
}
