'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Video, Camera, Mic, ChevronDown } from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import { checkAvailability, completeOnboarding } from './actions';
import Header from './components/Header';
import Footer from './components/Footer';

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

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onlineCount, setOnlineCount] = useState<number>(1420);
  const [talkMode, setTalkMode] = useState<'video' | 'audio'>('video');
  const isLoggedIn = !!clerkUser;

  // Live selfie camera preview for signed-in users
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrameHovered, setIsFrameHovered] = useState(false);

  // Hardware device selection (Camera & Mic)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');

  useEffect(() => {
    fetch('/api/roulette/online')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.count === 'number' && data.count > 0) {
          setOnlineCount(data.count);
        }
      })
      .catch(() => { });
  }, []);

  const refreshDevices = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vInputs = devices.filter((d) => d.kind === 'videoinput');
      const aInputs = devices.filter((d) => d.kind === 'audioinput');
      setVideoDevices(vInputs);
      setAudioDevices(aInputs);

      if (vInputs.length > 0) {
        setSelectedVideoId((prev) => {
          if (prev && vInputs.some((d) => d.deviceId === prev)) return prev;
          const saved = typeof window !== 'undefined' ? localStorage.getItem('supertime_selected_cam') : null;
          const matching = vInputs.find((d) => d.deviceId === saved);
          return matching ? matching.deviceId : vInputs[0].deviceId;
        });
      }
      if (aInputs.length > 0) {
        setSelectedAudioId((prev) => {
          if (prev && aInputs.some((d) => d.deviceId === prev)) return prev;
          const saved = typeof window !== 'undefined' ? localStorage.getItem('supertime_selected_mic') : null;
          const matching = aInputs.find((d) => d.deviceId === saved);
          return matching ? matching.deviceId : aInputs[0].deviceId;
        });
      }
    } catch (err) {
      console.warn('[Landing Hero Preview] enumerateDevices error:', err);
    }
  };

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      };
    }
  }, []);

  const startCameraStream = async (targetVideoId?: string) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const videoConstraints: MediaTrackConstraints = targetVideoId
        ? { deviceId: { exact: targetVideoId }, width: { ideal: 640 }, height: { ideal: 480 } }
        : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false, // muted self-preview
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCameraError(null);

      // Populate labeled devices after permission is granted
      await refreshDevices();
    } catch (err: any) {
      console.warn('[Landing Hero Preview] Camera mirror error:', err);
      setCameraActive(false);
      setCameraError(err.message || 'Camera preview not available');
    }
  };

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
      // Still refresh audio devices so mic can be selected
      refreshDevices();
      return;
    }

    startCameraStream(selectedVideoId);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isLoggedIn, talkMode]);

  const handleVideoChange = async (newDeviceId: string) => {
    setSelectedVideoId(newDeviceId);
    try {
      localStorage.setItem('supertime_selected_cam', newDeviceId);
    } catch {}
    if (talkMode === 'video' && isLoggedIn) {
      await startCameraStream(newDeviceId);
    }
  };

  const handleAudioChange = (newDeviceId: string) => {
    setSelectedAudioId(newDeviceId);
    try {
      localStorage.setItem('supertime_selected_mic', newDeviceId);
    } catch {}
  };

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
  const supertalksHref = `/supertalks?mode=${talkMode}${
    selectedVideoId ? `&cam=${encodeURIComponent(selectedVideoId)}` : ''
  }${selectedAudioId ? `&mic=${encodeURIComponent(selectedAudioId)}` : ''}`;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background antialiased transition-colors duration-300 flex flex-col justify-between">
      {/* Navigation */}
      <Header />

      {/* Hero Section — Balanced, Modern & Fit Within Viewport */}
      <section className="py-6 sm:py-8 md:py-10 flex-1 flex flex-col justify-center">
        <div className="w-full px-5 sm:px-8 md:px-12 max-w-5xl mx-auto">

          {/* ============================================================== */}
          {/* SIGNED-IN HERO STATE: Left Content + Right Live Mirror        */}
          {/* ============================================================== */}
          {isLoggedIn ? (
            <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Heading, Subtitle, Switcher, Button & Links */}
              <div className="md:col-span-7 space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Talk live in Supertime.
                </h1>

                <p className="text-sm sm:text-base text-muted leading-relaxed max-w-md">
                  Spontaneous 1-on-1 video conversations with real people. 30-second rounds. No awkward silences, just pure human presence.
                </p>

                {/* Media Mode Switcher (Video vs Audio-Only) */}
                <div className="flex items-center p-1 rounded-2xl bg-surface border border-border shadow-xs max-w-sm">
                  <button
                    type="button"
                    onClick={() => setTalkMode('video')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${talkMode === 'video'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted hover:text-foreground'
                      }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTalkMode('audio')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${talkMode === 'audio'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted hover:text-foreground'
                      }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Audio Only</span>
                  </button>
                </div>

                {/* Primary Action Button: Simple Black Button */}
                <div className="max-w-sm">
                  <Link
                    href={supertalksHref}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm sm:text-base hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
                  >
                    <span>{talkMode === 'audio' ? 'Start an Audio Supertalk' : 'Start a Supertalk'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Status / Quick Links */}
                <div className="flex items-center justify-between text-xs text-muted max-w-sm px-1 pt-0.5">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {onlineCount.toLocaleString()} online now
                  </span>
                  <div className="flex items-center gap-3">
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
              </div>

              {/* Right Column: Live Viewfinder Mirror */}
              <div className="md:col-span-5 flex justify-center">
                <div
                  onMouseEnter={() => setIsFrameHovered(true)}
                  onMouseLeave={() => setIsFrameHovered(false)}
                  className="group w-full max-w-xs sm:max-w-sm mx-auto relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-950 border border-border shadow-md"
                >
                  {talkMode === 'audio' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-950 select-none">
                      <div className="relative flex items-center justify-center mb-3">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 animate-ping absolute" />
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 animate-pulse absolute" />
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg relative z-10 text-black">
                          <Mic className="w-5 h-5 text-black" />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-white tracking-tight">Audio Mode Active</p>
                      <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                        Camera is off · Matching with audio-ready callers
                      </p>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-0'
                          }`}
                      />

                      {!cameraActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center mb-2">
                            <Camera className="w-4 h-4 text-muted" />
                          </div>
                          <p className="text-xs text-muted max-w-xs">
                            {cameraError ? cameraError : 'Starting camera mirror...'}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Bottom Hover Bar: Camera and Mic Source Selectors */}
                  <div className={`absolute bottom-2.5 inset-x-2.5 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 transition-all duration-200 z-20 ${
                    isFrameHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                  }`}>
                    {/* Video Source Selector (only in video mode) */}
                    {talkMode === 'video' && (
                      <div className="flex-1 relative min-w-0">
                        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[11px] font-medium transition-colors cursor-pointer min-w-0">
                          <Camera className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                          <select
                            value={selectedVideoId}
                            onChange={(e) => handleVideoChange(e.target.value)}
                            className="bg-transparent text-white text-[11px] font-medium outline-none cursor-pointer w-full truncate appearance-none pr-3"
                            title="Select Camera"
                          >
                            {videoDevices.length > 0 ? (
                              videoDevices.map((d, i) => (
                                <option key={d.deviceId || i} value={d.deviceId} className="bg-neutral-900 text-white text-xs">
                                  {d.label || `Camera ${i + 1}`}
                                </option>
                              ))
                            ) : (
                              <option value="" className="bg-neutral-900 text-white text-xs">
                                {cameraActive ? 'Camera Connected' : 'Default Camera'}
                              </option>
                            )}
                          </select>
                          <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 pointer-events-none shrink-0" />
                        </div>
                      </div>
                    )}

                    {/* Audio Source Selector */}
                    <div className="flex-1 relative min-w-0">
                      <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[11px] font-medium transition-colors cursor-pointer min-w-0">
                        <Mic className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                        <select
                          value={selectedAudioId}
                          onChange={(e) => handleAudioChange(e.target.value)}
                          className="bg-transparent text-white text-[11px] font-medium outline-none cursor-pointer w-full truncate appearance-none pr-3"
                          title="Select Microphone"
                        >
                          {audioDevices.length > 0 ? (
                            audioDevices.map((d, i) => (
                              <option key={d.deviceId || i} value={d.deviceId} className="bg-neutral-900 text-white text-xs">
                                {d.label || `Mic ${i + 1}`}
                              </option>
                            ))
                          ) : (
                            <option value="" className="bg-neutral-900 text-white text-xs">Default Mic</option>
                          )}
                        </select>
                        <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 pointer-events-none shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* SIGNED-OUT HERO STATE: Left Content + Right Claim Card        */
            /* ============================================================== */
            <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Heading, Subtitle, Switcher, Button & Online Count */}
              <div className="md:col-span-7 space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Talk live in Supertime.
                </h1>

                <p className="text-sm sm:text-base text-muted leading-relaxed max-w-md">
                  Spontaneous 1-on-1 video conversations with real people. 30-second rounds. No awkward silences, just pure human presence.
                </p>

                {/* Media Mode Switcher (Video vs Audio-Only) */}
                <div className="flex items-center p-1 rounded-2xl bg-surface border border-border shadow-xs max-w-sm">
                  <button
                    type="button"
                    onClick={() => setTalkMode('video')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${talkMode === 'video'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted hover:text-foreground'
                      }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTalkMode('audio')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${talkMode === 'audio'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted hover:text-foreground'
                      }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Audio Only</span>
                  </button>
                </div>

                {/* Primary Action Button: Simple Black Button */}
                <div className="max-w-sm">
                  <Link
                    href={supertalksHref}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm sm:text-base hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
                  >
                    <span>{talkMode === 'audio' ? 'Start an Audio Supertalk' : 'Start a Supertalk'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Online status */}
                <div className="flex items-center gap-2 text-xs text-muted max-w-sm px-1 pt-0.5">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {onlineCount.toLocaleString()} online now
                  </span>
                </div>
              </div>

              {/* Right Column: Claim Handle Card */}
              <div className="md:col-span-5 flex justify-center">
                <div className="w-full max-w-sm p-5 sm:p-6 rounded-3xl bg-surface border border-border shadow-xs space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                      Or claim your personal link
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Reserve your personal handle for direct calls and live presence.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="w-full">
                    <div className="flex items-center bg-background border border-border rounded-xl overflow-hidden focus-within:border-foreground transition-all p-1 shadow-xs">
                      <span className="text-muted text-[11px] sm:text-xs font-medium pl-2 sm:pl-2.5 select-none shrink-0">supertime.wtf/</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="yourname"
                        className="flex-1 bg-transparent border-none outline-none text-foreground font-medium text-xs placeholder:text-muted/50 px-1.5 py-2 min-w-0"
                      />
                      <button
                        type="submit"
                        disabled={!username || loading}
                        className="bg-black dark:bg-white text-white dark:text-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-40 transition-all shrink-0 cursor-pointer"
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
            </div>
          )}

        </div>
      </section>

      {/* Footer */}
      <Footer className="mt-auto py-5" />
    </div>
  );
}
