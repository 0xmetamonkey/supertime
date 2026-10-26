'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Video, Sparkles, Check, Camera, Maximize, ShieldCheck, Mic, MicOff } from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import { checkAvailability, completeOnboarding } from './actions';
import Header from './components/Header';
import Footer from './components/Footer';
import SafetyModal from './components/SafetyModal';
import { useLanguage } from './components/LanguageContext';

export default function LandingPageClient({
  session,
  savedUsername,
  featuredCreators = []
}: {
  session: any,
  savedUsername: string | null,
  featuredCreators?: any[]
}) {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { t } = useLanguage();

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onlineCount, setOnlineCount] = useState<number>(1420);
  const [talkMode, setTalkMode] = useState<'video' | 'audio'>('video');
  const [showAudioNotice, setShowAudioNotice] = useState(false);
  const isLoggedIn = !!clerkUser;

  // Live selfie camera preview for signed-in users
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
  };

  useEffect(() => {
    fetch('/api/roulette/online')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.count === 'number' && data.count > 0) {
          setOnlineCount(data.count);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize camera preview if user is signed in and in video mode
  useEffect(() => {
    if (!isLoggedIn) return;

    if (talkMode === 'audio') {
      // In audio mode, turn off camera mirror completely
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      return;
    }

    let mounted = true;
    async function initSelfiePreview() {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false, // muted self-preview
        });

        if (mounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraActive(true);
          setCameraError(null);
        } else {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err: any) {
        if (mounted) {
          console.warn('[Landing Hero Preview] Camera mirror error:', err);
          setCameraActive(false);
          setCameraError(err.message || 'Camera preview not available');
        }
      }
    }

    initSelfiePreview();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isLoggedIn, talkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setError('');
    setLoading(true);

    try {
      const isAvailable = await checkAvailability(username);
      if (!isAvailable) {
        setError('Username taken. Try another?');
        setLoading(false);
        return;
      }

      if (isLoggedIn) {
        await completeOnboarding(username, 'creator');
        window.location.href = '/dashboard';
      } else {
        router.push(`/sign-in?forceRedirectUrl=/dashboard`);
      }
    } catch (e: any) {
      console.error("Claim Error:", e);
      setError(e.message || "Failed to process request. Try again.");
      setLoading(false);
    }
  };

  const currentHandle = savedUsername || clerkUser?.username;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background antialiased transition-colors duration-300">
      {/* Navigation */}
      <Header />

      {/* Hero Section — Minimal & Mobile-First */}
      <section className="pt-8 sm:pt-14 md:pt-20 pb-16 sm:pb-20 md:pb-28">
        <div className="w-full px-5 sm:px-8 md:px-12 max-w-5xl mx-auto">
          
          {/* Top Bar with Live Badge & Right-side Safety + Fullscreen controls */}
          <div className="flex items-center justify-between gap-3 mb-5 max-w-md sm:max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE 1-ON-1 VIDEO</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Safety Button */}
              <button
                onClick={() => setIsSafetyOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/80 hover:border-emerald-500/50 text-xs font-medium text-foreground hover:text-emerald-400 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Safety Guidelines & Trust"
                aria-label="Safety Guidelines"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Safety</span>
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-full bg-surface border border-border/80 hover:border-foreground/40 text-muted hover:text-foreground transition-all cursor-pointer active:scale-95"
                title="Fullscreen Mode"
                aria-label="Toggle Fullscreen"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-3">
            Talk live in Supertime.
          </h1>
          
          {/* Subtitle */}
          <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl mb-6">
            Spontaneous 1-on-1 video conversations with real people. 30-second rounds. No awkward silences, just pure human presence.
          </p>

          {/* ============================================================== */}
          {/* SIGNED-IN HERO STATE: Live Selfie Mirror + Start Button       */}
          {/* ============================================================== */}
          {isLoggedIn ? (
            <div className="max-w-md space-y-4">
              
              {/* Media Mode Switcher (Video vs Audio-Only) */}
              <div className="flex items-center p-1 rounded-2xl bg-surface/90 border border-border shadow-xs">
                <button
                  type="button"
                  onClick={() => setTalkMode('video')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    talkMode === 'video'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (talkMode !== 'audio') {
                      setShowAudioNotice(true);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    talkMode === 'audio'
                      ? 'bg-emerald-500 text-black shadow-xs font-black'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Audio Only 🎙️</span>
                </button>
              </div>

              {/* Viewfinder Card (Camera mirror in Video Mode, Voice Orb in Audio Mode) */}
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-950 border border-border shadow-2xl">
                {talkMode === 'audio' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 select-none">
                    <div className="relative flex items-center justify-center mb-4">
                      <div className="w-28 h-28 rounded-full bg-emerald-500/10 animate-ping absolute" />
                      <div className="w-20 h-20 rounded-full bg-emerald-500/20 animate-pulse absolute" />
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-2xl shadow-xl relative z-10 text-black font-black">
                        🎙️
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white tracking-tight">Audio Mode Active</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                      Camera is off · You will only match with audio-ready artists and people
                    </p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${
                        cameraActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-2">
                          <Camera className="w-5 h-5 text-muted" />
                        </div>
                        <p className="text-xs text-muted max-w-xs">
                          {cameraError ? cameraError : 'Starting camera mirror...'}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Floating Self Tag */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{talkMode === 'audio' ? 'Audio ready' : 'Camera ready'}</span>
                </div>

                {currentHandle && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white font-mono">
                    @{currentHandle}
                  </div>
                )}
              </div>

              {/* Primary Action Button: Jump into Supertalks */}
              <Link
                href={`/supertalks?mode=${talkMode}`}
                className={`group w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl text-white font-semibold shadow-xl active:scale-[0.98] hover:opacity-95 transition-all cursor-pointer ${
                  talkMode === 'audio'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 shadow-rose-500/25'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                    {talkMode === 'audio' ? '🎙️' : '⚡'}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base sm:text-lg">
                        {talkMode === 'audio' ? 'Start an Audio Supertalk' : 'Start a Supertalk'}
                      </span>
                      <span className="bg-white/25 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                        {talkMode === 'audio' ? 'Audio Pool' : 'Live'}
                      </span>
                    </div>
                    <p className="text-xs text-white/85 font-normal mt-0.5">
                      {talkMode === 'audio'
                        ? 'Audio-only match · Camera stays off'
                        : 'Find someone live · 30s rounds'}
                    </p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </Link>

              {/* Status / Quick Links */}
              <div className="flex items-center justify-between text-xs text-muted px-1 pt-1">
                <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {onlineCount.toLocaleString()} online now
                </span>
                <span>•</span>
                <Link href="/dashboard" className="text-foreground hover:underline font-semibold flex items-center gap-1">
                  Studio <ArrowRight className="w-3 h-3" />
                </Link>
                {currentHandle && (
                  <>
                    <span>•</span>
                    <Link href={`/${currentHandle}`} className="text-foreground hover:underline font-semibold">
                      Profile
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* SIGNED-OUT HERO STATE: Button + Handle Claim                   */
            /* ============================================================== */
            <div className="max-w-md space-y-4">
              {/* Media Mode Switcher (Video vs Audio-Only) */}
              <div className="flex items-center p-1 rounded-2xl bg-surface/90 border border-border shadow-xs">
                <button
                  type="button"
                  onClick={() => setTalkMode('video')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    talkMode === 'video'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (talkMode !== 'audio') {
                      setShowAudioNotice(true);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    talkMode === 'audio'
                      ? 'bg-emerald-500 text-black shadow-xs font-black'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Audio Only 🎙️</span>
                </button>
              </div>

              <Link
                href={`/supertalks?mode=${talkMode}`}
                className={`group w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl text-white font-semibold shadow-lg active:scale-[0.98] hover:opacity-95 transition-all cursor-pointer ${
                  talkMode === 'audio'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 shadow-rose-500/25'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                    {talkMode === 'audio' ? '🎙️' : '⚡'}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base sm:text-lg">
                        {talkMode === 'audio' ? 'Start an Audio Supertalk' : 'Start a Supertalk'}
                      </span>
                      <span className="bg-white/25 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                        {talkMode === 'audio' ? 'Audio Pool' : 'Live'}
                      </span>
                    </div>
                    <p className="text-xs text-white/85 font-normal mt-0.5">
                      {talkMode === 'audio'
                        ? 'Audio-only match · Camera stays off'
                        : 'Instant 1-on-1 video · 30s rounds'}
                    </p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </Link>

              {/* Feature Pills */}
              <div className="flex items-center justify-between text-xs text-muted px-1 pt-1">
                <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {onlineCount.toLocaleString()} online now
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  ⏱️ 30s timer
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  🔒 Peer-to-peer
                </span>
              </div>

              {/* Claim Handle Section */}
              <div className="pt-6 border-t border-border/80">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">
                  Or claim your personal link
                </div>

                <form onSubmit={handleSubmit} className="w-full">
                  <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-foreground transition-all p-1 shadow-sm">
                    <span className="text-muted text-xs sm:text-sm font-medium pl-3 select-none">supertime.wtf/</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="yourname"
                      className="flex-1 bg-transparent border-none outline-none text-foreground font-medium text-xs sm:text-sm placeholder:text-muted/50 px-2 py-2 min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!username || loading}
                      className="bg-foreground text-background text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
                    >
                      {loading ? '...' : 'Claim'}
                    </button>
                  </div>
                  {error && (
                    <div className="text-xs font-medium text-red-500 pt-1.5 pl-1">
                      {error}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Safety Modal */}
      <SafetyModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
      />

      {/* Audio Mode Switch Confirmation Modal */}
      {showAudioNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl shadow-inner">
              🎙️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">Switch to Audio-Only Mode?</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Your camera will be turned off. You will only be connected to artists and callers who are also in audio-only mode.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTalkMode('audio');
                  setShowAudioNotice(false);
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-colors cursor-pointer active:scale-95 shadow-md shadow-emerald-500/20"
              >
                Got it, Switch to Audio Mode 🎙️
              </button>
              <button
                type="button"
                onClick={() => setShowAudioNotice(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel (Stay in Video Mode)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
