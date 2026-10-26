'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  Video,
  VideoOff,
  SwitchCamera,
  Shield,
  Clock,
  Shuffle,
  Zap,
  Sparkles,
  Loader2,
  AlertCircle,
  Heart,
  Volume2
} from 'lucide-react';
import AudioMeter from './AudioMeter';

interface MatchingLobbyProps {
  title?: string;
  subtitle?: string;
  onStartMatching: (stream: MediaStream | null) => void;
}

export default function MatchingLobby({
  title = 'Supertalks',
  subtitle = 'Spontaneous 1-on-1 video conversations. Real people, 30-second rounds, peer-to-peer WebRTC.',
  onStartMatching,
}: MatchingLobbyProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(1420);
  const [isStarting, setIsStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Fetch live online count
  useEffect(() => {
    let isMounted = true;
    const fetchOnline = () => {
      fetch('/api/roulette/online')
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && typeof data?.count === 'number' && data.count > 0) {
            setOnlineCount(data.count);
          }
        })
        .catch(() => {});
    };

    fetchOnline();
    const interval = setInterval(fetchOnline, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Detect multiple video input devices (front/back camera)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        if (videoInputs.length > 1) {
          setHasMultipleCameras(true);
        }
      }).catch(() => {});
    }
  }, []);

  // 3. Request camera and mic access upfront immediately
  const requestMedia = useCallback(async (desiredFacing: 'user' | 'environment' = facingMode) => {
    setPermissionStatus('requesting');
    setErrorMessage(null);

    // Stop existing tracks before requesting fresh ones
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }

    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported in this browser. Please open in Chrome or Safari.');
      }

      let userStream: MediaStream | null = null;

      // Strategy 1: Ideal video (facingMode) + echo-cancelled audio
      try {
        userStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: desiredFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (errCombined) {
        console.warn('[MatchingLobby] Preferred constraints failed, falling back to basic video+audio...', errCombined);
        try {
          userStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (errBasic) {
          console.warn('[MatchingLobby] Basic video+audio failed, falling back to video only...', errBasic);
          userStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          // Attempt optional audio
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioTrack = audioStream.getAudioTracks()[0];
            if (audioTrack && userStream.active) {
              userStream.addTrack(audioTrack);
            }
          } catch {
            // Audio optional fallback
          }
        }
      }

      if (!userStream) {
        throw new Error('Could not access camera or microphone.');
      }

      streamRef.current = userStream;
      setStream(userStream);
      setPermissionStatus('granted');

      // Sync initial track states
      const audioTrack = userStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioMuted;
      }
      const videoTrack = userStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoMuted;
      }
    } catch (err: any) {
      console.error('[MatchingLobby] Camera/mic permission error:', err);
      setPermissionStatus('denied');
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera & microphone access was denied. Please allow camera and mic permissions in your browser address bar.'
          : err.message || 'Unable to access your camera or microphone.'
      );
    }
  }, [facingMode, isAudioMuted, isVideoMuted]);

  // Run on mount
  useEffect(() => {
    requestMedia('user');

    return () => {
      // Do NOT stop tracks if user clicked "Start Matching" (we hand the stream off!)
      // But if user unmounts/navigates back to home, stop tracks.
      if (!isStarting && streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Attach stream to video preview element
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.play().catch((err) => {
        console.warn('[MatchingLobby] Video play warning:', err);
      });
    }
  }, [stream]);

  // Toggle Mic
  const toggleMic = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video
  const toggleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  // Flip Camera
  const flipCamera = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    await requestMedia(nextMode);
  };

  // Start Matching Trigger
  const handleStartMatching = () => {
    if (isStarting) return;
    setIsStarting(true);
    onStartMatching(streamRef.current);
  };

  // Spacebar or Enter shortcut to start matching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          handleStartMatching();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stream, isStarting]);

  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-white font-sans flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] bg-amber-500/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[55%] h-[55%] bg-yellow-600/10 blur-[140px] rounded-full" />
      </div>

      {/* Header with Navigation & Realtime Online Count */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>

        {/* Live Online Count Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 backdrop-blur-md shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-bold text-white tracking-wide">
            {onlineCount.toLocaleString()}
          </span>
          <span className="text-neutral-400">online</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-xl mx-auto w-full my-auto py-4 flex flex-col items-center text-center space-y-5">
        {/* Title and Subtitle */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Spontaneous Video</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {title}
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Live Camera Viewfinder Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[360px] rounded-3xl bg-neutral-900 border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden group"
        >
          {/* Active Live Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isVideoMuted ? 'opacity-0' : 'opacity-100'
            } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Video Muted Overlay */}
          {isVideoMuted && permissionStatus === 'granted' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 text-neutral-400 gap-2">
              <VideoOff className="w-10 h-10 text-neutral-500" />
              <p className="text-xs font-medium">Your camera is turned off</p>
              <button
                type="button"
                onClick={toggleVideo}
                className="mt-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                Turn Camera On
              </button>
            </div>
          )}

          {/* Requesting Camera & Mic State */}
          {permissionStatus === 'requesting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/90 text-neutral-300 gap-3 p-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Starting your camera & mic...</p>
                <p className="text-xs text-neutral-400 max-w-xs">
                  Please click &ldquo;Allow&rdquo; in your browser prompt when asked.
                </p>
              </div>
            </div>
          )}

          {/* Permission Denied / Error State */}
          {permissionStatus === 'denied' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 text-neutral-300 gap-3 p-6 text-center z-20">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-400" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-white">Camera & Mic Access Required</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {errorMessage || 'Camera access is required to connect with people on Supertalks.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => requestMedia(facingMode)}
                className="mt-1 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Grant Camera & Mic Access</span>
              </button>
            </div>
          )}

          {/* Viewfinder Top Badges */}
          {permissionStatus === 'granted' && (
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[11px] text-neutral-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Camera Ready</span>
              </div>
              <div className="text-[11px] font-mono text-neutral-300 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                Self Preview
              </div>
            </div>
          )}

          {/* Viewfinder Bottom Controls (Audio Meter, Mic Toggle, Cam Toggle, Flip) */}
          {permissionStatus === 'granted' && (
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10">
              {/* Real-time Audio Visualizer */}
              <div className="flex items-center gap-2 bg-black/60 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg">
                <AudioMeter
                  stream={stream}
                  isMuted={isAudioMuted}
                  className="bg-transparent p-0"
                />
                <span className="text-[10px] text-neutral-300 font-medium">
                  {isAudioMuted ? 'Muted' : 'Mic Active'}
                </span>
              </div>

              {/* In-Preview Camera Controls */}
              <div className="flex items-center gap-2">
                {/* Mic Mute Toggle */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2.5 rounded-full backdrop-blur-md border transition-all active:scale-95 cursor-pointer shadow-md ${
                    isAudioMuted
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-black/60 border-white/10 text-white hover:bg-black/80'
                  }`}
                  title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
                  aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Video Mute Toggle */}
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-2.5 rounded-full backdrop-blur-md border transition-all active:scale-95 cursor-pointer shadow-md ${
                    isVideoMuted
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-black/60 border-white/10 text-white hover:bg-black/80'
                  }`}
                  title={isVideoMuted ? 'Turn camera on' : 'Turn camera off'}
                  aria-label={isVideoMuted ? 'Turn camera on' : 'Turn camera off'}
                >
                  {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>

                {/* Flip Camera (if available) */}
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={flipCamera}
                    className="p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
                    title="Flip camera"
                    aria-label="Flip camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* PRIMARY ACTION: THE TEXT TO START MATCHING */}
        <div className="w-full pt-1 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartMatching}
            disabled={isStarting}
            className="group relative w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-black font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-[0_4px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_4px_40px_rgba(245,158,11,0.5)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Entering Live Pool...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span className="tracking-tight">Start Matching with People</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>

          <p className="text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-neutral-500" />
            <span>Equal 30-second rounds · Mutual <span className="text-amber-400 font-semibold">+Time</span> extensions · Instant skip</span>
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-3 gap-2.5 w-full pt-1 text-left">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <Clock className="w-4 h-4 text-amber-400 mb-1" />
            <div className="text-xs font-semibold text-neutral-200">30s Clock</div>
            <div className="text-[10px] text-neutral-500">Mutual +30s sand</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <Shuffle className="w-4 h-4 text-rose-400 mb-1" />
            <div className="text-xs font-semibold text-neutral-200">Instant Skip</div>
            <div className="text-[10px] text-neutral-500">Next match &lt;1s</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <Zap className="w-4 h-4 text-emerald-400 mb-1" />
            <div className="text-xs font-semibold text-neutral-200">P2P Mesh</div>
            <div className="text-[10px] text-neutral-500">Zero vendor lag</div>
          </div>
        </div>
      </main>



      {/* Footer */}
      <footer className="relative z-10 text-center text-[11px] text-neutral-600 max-w-xl mx-auto w-full pt-2">
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 font-mono text-[10px]">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 font-mono text-[10px]">Enter</kbd> to match</span>
      </footer>
    </div>
  );
}
