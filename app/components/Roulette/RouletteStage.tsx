'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  FastForward,
  Clock,
  Sparkles,
  SwitchCamera,
  X,
  ShieldAlert,
  Loader2,
  Heart,
  Flame,
  Laugh,
  ThumbsUp,
  Volume2,
  Phone,
  Coins,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import AudioMeter from './AudioMeter';
import { useWebRTC } from '@/app/hooks/useWebRTC';
import { useRouletteSocket, MatchedEvent, SignalEvent, PartnerMeta } from '@/app/hooks/useRouletteSocket';
import { playTimeRequestSound, playTimeExtendedSound, playRouteSwitchSound } from '@/app/utils/soundEffects';

interface RouletteStageProps {
  onClose?: () => void;
  defaultTimerDuration?: number;
  initialLocalStream?: MediaStream | null;
  initialMode?: 'video' | 'audio';
  initialUserMeta?: {
    isCreator?: boolean;
    username?: string;
    creatorEmail?: string;
    videoRate?: number;
    displayName?: string;
  };
}

const DEFAULT_DURATION = 30; // 30 seconds default countdown

const SEARCHING_QUOTES = [
  { text: "A stranger is just a friend you haven't met yet.", author: "W.B. Yeats" },
  { text: "The greatest adventures begin with a simple hello.", author: "Spontaneous" },
  { text: "Real connections happen when you least expect them.", author: "Supertime" },
  { text: "30 seconds can spark an idea that lasts a lifetime.", author: "Discovery" },
  { text: "Step out of your comfort zone. Meet the world.", author: "Open Mind" },
  { text: "Be curious, not judgmental. Enjoy the conversation!", author: "Walt Whitman" },
  { text: "Every person you meet knows something you don't.", author: "Bill Nye" },
  { text: "Spontaneity is the spice of human connection.", author: "Unscripted" },
];

const ICEBREAKERS = [
  "What song is currently on repeat for you?",
  "If you could teleport anywhere right now, where to?",
  "What's a talent or hobby people wouldn't guess you have?",
  "Coffee, tea, or water to start your day?",
  "What's the best movie or show you watched this year?",
  "If you had 1 superpower for 24 hours, what would it be?",
  "What's one thing that made you smile today?",
];

export default function RouletteStage({
  onClose,
  defaultTimerDuration = DEFAULT_DURATION,
  initialLocalStream,
  initialMode = 'video',
  initialUserMeta,
}: RouletteStageProps) {
  const [peerId] = useState(() => `peer_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`);
  const [callMode, setCallMode] = useState<'video' | 'audio'>(initialMode);

  // Roulette States
  const [sessionState, setSessionState] = useState<'idle' | 'searching' | 'connecting' | 'connected' | 'skipped'>('idle');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerMeta, setPartnerMeta] = useState<PartnerMeta | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [role, setRole] = useState<'initiator' | 'receiver' | null>(null);
  const [recentPeers, setRecentPeers] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>(
    initialMode === 'audio' ? 'Initializing microphone...' : 'Initializing camera...'
  );

  // Dynamic Searching Quotes & Quick Partner Info (Zero-Delay HUD)
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [icebreaker, setIcebreaker] = useState<string>('');
  const [showPartnerDossier, setShowPartnerDossier] = useState<boolean>(false);
  const [isRetryingCam, setIsRetryingCam] = useState<boolean>(false);
  const isSkippingRef = useRef<boolean>(false);

  // Wallet & Monetization States
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [lowBalanceAlert, setLowBalanceAlert] = useState<boolean>(false);
  const [extensionMessage, setExtensionMessage] = useState<string>('+30s Added!');

  // Timer & Extension States
  const [timeLeft, setTimeLeft] = useState<number>(defaultTimerDuration);
  const [hasRequestedTime, setHasRequestedTime] = useState<boolean>(false);
  const [peerRequestedTime, setPeerRequestedTime] = useState<boolean>(false);
  const [showExtensionAlert, setShowExtensionAlert] = useState<boolean>(false);

  // Floating Reactions
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number }>>([]);

  // Video & Audio element references
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioLocked, setIsAudioLocked] = useState<boolean>(false);

  // Audio Output Routing (Speaker vs Earpiece)
  const [audioOutputRoute, setAudioOutputRoute] = useState<'speaker' | 'earpiece'>('speaker');
  const [audioOutputToast, setAudioOutputToast] = useState<string | null>(null);

  const toggleAudioOutput = useCallback(async () => {
    const nextRoute = audioOutputRoute === 'speaker' ? 'earpiece' : 'speaker';
    setAudioOutputRoute(nextRoute);
    playRouteSwitchSound();

    const audioEl = remoteAudioRef.current;
    const videoEl = remoteVideoRef.current;

    // 1. Hardware Sink Selection (Chrome, Edge, Android Chrome, Safari 17.2+)
    try {
      if (audioEl && typeof (audioEl as any).setSinkId === 'function') {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === 'audiooutput');

        if (nextRoute === 'earpiece') {
          const earpiece = outputs.find((d) => {
            const l = d.label.toLowerCase();
            return (
              l.includes('earpiece') ||
              l.includes('receiver') ||
              l.includes('handset') ||
              l.includes('phone') ||
              l.includes('internal') ||
              d.deviceId === 'communications'
            );
          });

          if (earpiece) {
            await (audioEl as any).setSinkId(earpiece.deviceId);
            if (videoEl && typeof (videoEl as any).setSinkId === 'function') {
              await (videoEl as any).setSinkId(earpiece.deviceId);
            }
          } else if (outputs.length > 1) {
            const alt = outputs.find((d) => d.deviceId !== 'default');
            if (alt) {
              await (audioEl as any).setSinkId(alt.deviceId);
            }
          }
        } else {
          // Speaker
          const speaker = outputs.find((d) => {
            const l = d.label.toLowerCase();
            return l.includes('speaker') || l.includes('loudspeaker');
          });
          const targetId = speaker ? speaker.deviceId : '';
          await (audioEl as any).setSinkId(targetId);
          if (videoEl && typeof (videoEl as any).setSinkId === 'function') {
            await (videoEl as any).setSinkId(targetId);
          }
        }
      }
    } catch (err) {
      console.warn('[AudioOutput] Error setting sink ID:', err);
    }

    // 2. Volume & Acoustic Curve:
    // In earpiece mode, the device is held against the ear, so volume is set to 0.45.
    // In speaker mode, volume is 1.0 (loudspeaker).
    if (audioEl) {
      audioEl.volume = nextRoute === 'earpiece' ? 0.45 : 1.0;
    }
    if (videoEl) {
      videoEl.volume = nextRoute === 'earpiece' ? 0.45 : 1.0;
    }

    // 3. Inform React Native WebView shell if running in mobile app
    if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'SET_AUDIO_OUTPUT', route: nextRoute })
      );
    }

    // 4. Show toast notification
    const msg = nextRoute === 'earpiece' ? 'Audio: Earpiece 📞' : 'Audio: Speaker 🔊';
    setAudioOutputToast(msg);
    setTimeout(() => setAudioOutputToast(null), 2500);
  }, [audioOutputRoute]);

  // Fetch current user wallet balance on mount
  useEffect(() => {
    fetch('/api/wallet')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.balance === 'number') {
          setWalletBalance(data.balance);
        }
      })
      .catch(() => {});
  }, []);

  // Stable references for async callbacks
  const roomIdRef = useRef<string | null>(null);
  roomIdRef.current = roomId;
  const partnerIdRef = useRef<string | null>(null);
  partnerIdRef.current = partnerId;
  const recentPeersRef = useRef<string[]>([]);
  recentPeersRef.current = recentPeers;
  const partnerMetaRef = useRef<PartnerMeta | null>(null);
  partnerMetaRef.current = partnerMeta;

  // Forward refs for WebRTC methods
  const createOfferRef = useRef<() => Promise<RTCSessionDescriptionInit | null>>(async () => null);
  const handleOfferRef = useRef<(sdp: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | null>>(async () => null);
  const handleAnswerRef = useRef<(sdp: RTCSessionDescriptionInit) => Promise<void>>(async () => {});
  const handleIceCandidateRef = useRef<(candidate: RTCIceCandidateInit) => Promise<void>>(async () => {});

  // Socket communication hook
  const {
    isConnected: isSocketConnected,
    joinQueue: socketJoinQueue,
    sendSignal: socketSendSignal,
    skip: socketSkip,
    requestTimeExtension: socketRequestTimeExtension,
    acceptTimeExtension: socketAcceptTimeExtension,
    sendReaction: socketSendReaction,
    onlineCount,
  } = useRouletteSocket({
    peerId,
    onMatched: async (match: MatchedEvent) => {
      console.log('[Roulette Stage] Matched with partner:', match.partnerId, 'role:', match.role, 'room:', match.roomId);
      // Clean up any previous peer connection immediately so new match starts completely fresh
      cleanupPeerConnection();

      // Synchronously set refs immediately so early ICE candidates & signals are never dropped
      roomIdRef.current = match.roomId;
      partnerIdRef.current = match.partnerId;
      partnerMetaRef.current = match.partnerMeta || null;

      setRoomId(match.roomId);
      setPartnerId(match.partnerId);
      setPartnerMeta(match.partnerMeta || null);
      setRole(match.role);
      if (match.mode) {
        setCallMode(match.mode);
      }
      setSessionState('connecting');
      setStatusMessage(match.mode === 'audio' ? 'Matched! Connecting live audio...' : 'Matched! Connecting live video...');
      setTimeLeft(defaultTimerDuration);
      setHasRequestedTime(false);
      setPeerRequestedTime(false);

      if (match.role === 'initiator') {
        setTimeout(async () => {
          try {
            console.log('[Roulette Stage] Initiator creating WebRTC offer for room:', match.roomId);
            const offer = await createOfferRef.current();
            if (offer && roomIdRef.current === match.roomId) {
              socketSendSignal(match.roomId, 'offer', offer);
            }
          } catch (err) {
            console.error('[Roulette Stage] Error creating offer:', err);
          }
        }, 150);
      }
    },
    onSignal: async (signal: SignalEvent) => {
      try {
        if (signal.type === 'offer') {
          console.log('[Roulette Stage] Received offer, handling...');
          const answer = await handleOfferRef.current(signal.data);
          if (answer && roomIdRef.current) {
            console.log('[Roulette Stage] Sending answer back...');
            socketSendSignal(roomIdRef.current, 'answer', answer);
          }
        } else if (signal.type === 'answer') {
          console.log('[Roulette Stage] Received answer, setting remote description...');
          await handleAnswerRef.current(signal.data);
        } else if (signal.type === 'candidate') {
          if (signal.data) {
            await handleIceCandidateRef.current(signal.data);
          }
        }
      } catch (err) {
        console.error('[Roulette Stage] Error handling signal:', signal.type, err);
      }
    },
    onPeerSkipped: () => {
      console.log('[Roulette Stage] Stranger skipped');
      setStatusMessage('Stranger moved on to the next person.');
      triggerSkip(true);
    },
    onPeerLeft: () => {
      console.log('[Roulette Stage] Stranger disconnected');
      setStatusMessage('Stranger disconnected. Finding someone new...');
      triggerSkip(true);
    },
    onPeerRequestedTime: (payload) => {
      console.log('[Roulette Stage] Peer requested time:', payload);
      setPeerRequestedTime(true);
      playTimeRequestSound();
    },
    onTimeExtended: (payload) => {
      const added = payload.addedSeconds || 30;
      const cost = payload.cost || 0;
      setTimeLeft((prev) => prev + added);

      if (cost > 0) {
        if (partnerMetaRef.current?.isCreator) {
          // We paid the artist
          setExtensionMessage(`-${cost} Tokens · +${added}s Added! ⏳`);
          setWalletBalance((prev) => Math.max(0, prev - cost));
        } else {
          // We earned as the artist
          const earned = Math.floor(cost * 0.8);
          setExtensionMessage(`-${cost} Tokens · +${added}s Added! ⏳`);
          setWalletBalance((prev) => prev + earned);
        }
      } else {
        setExtensionMessage(`+${added}s Added! ✨`);
      }

      setShowExtensionAlert(true);
      setHasRequestedTime(false);
      setPeerRequestedTime(false);
      playTimeExtendedSound();
      setTimeout(() => setShowExtensionAlert(false), 2500);
    },
    onReaction: (payload) => {
      triggerFloatingEmoji(payload.emoji || '🔥');
    },
    onQueued: () => {
      setSessionState('searching');
      setStatusMessage('Searching for someone to talk to...');
    },
  });

  // Cost calculation for 30 seconds: creator rate or base 10 tokens
  const currentCost = partnerMeta?.isCreator && (partnerMeta.videoRate || 0) > 0
    ? Math.ceil(partnerMeta.videoRate / 2)
    : 10;

  // Initialize WebRTC Hook
  const {
    localStream,
    remoteStream,
    connectionState,
    isAudioMuted,
    isVideoMuted,
    facingMode,
    hasCameraPermission,
    error: rtcError,
    initLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupPeerConnection,
    toggleAudio,
    toggleVideo,
    flipCamera,
  } = useWebRTC({
    initialStream: initialLocalStream,
    mode: callMode,
    onIceCandidate: (candidate) => {
      if (roomIdRef.current) {
        const payload = candidate.toJSON
          ? candidate.toJSON()
          : {
              candidate: candidate.candidate,
              sdpMid: candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex,
              usernameFragment: candidate.usernameFragment,
            };
        socketSendSignal(roomIdRef.current, 'candidate', payload);
      }
    },
    onConnectionStateChange: (state) => {
      console.log('[Roulette Stage] WebRTC connection state:', state);
      if (state === 'connected') {
        setSessionState('connected');
        setStatusMessage('Connected!');
      } else if (state === 'failed' || state === 'disconnected') {
        setStatusMessage('Connection lost. Finding next peer...');
        triggerSkip(false);
      }
    },
  });

  // Keep ref copies up to date
  createOfferRef.current = createOffer;
  handleOfferRef.current = handleOffer;
  handleAnswerRef.current = handleAnswer;
  handleIceCandidateRef.current = handleIceCandidate;

  // Attach local media stream to local video element
  useEffect(() => {
    const video = localVideoRef.current;
    if (video && localStream) {
      video.srcObject = localStream;
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[WebRTC] Local video play error (will retry on touch):', err);
        });
      }
    }
  }, [localStream]);

  // Attach remote media stream to remote video & audio elements
  useEffect(() => {
    const video = remoteVideoRef.current;
    const audio = remoteAudioRef.current;

    if (remoteStream) {
      console.log('[Roulette Stage] Attaching remoteStream tracks:', remoteStream.getTracks().map((t) => `${t.kind}:${t.enabled}:${t.readyState}`));
      
      if (video) {
        if (video.srcObject !== remoteStream) {
          video.srcObject = remoteStream;
        }
        // Video element MUST be muted so browser Autoplay Policy NEVER pauses video frame decoding!
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');

        // Immediate play call - do not stall on metadata
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[WebRTC] Remote video initial play error:', err);
          });
        }

        const handleLoaded = () => {
          video.play().catch(() => {});
        };
        video.addEventListener('loadedmetadata', handleLoaded, { once: true });
        video.addEventListener('canplay', handleLoaded, { once: true });
      }

      if (audio) {
        if (audio.srcObject !== remoteStream) {
          audio.srcObject = remoteStream;
        }
        audio.muted = false; // Audio element plays remote sound
        audio.volume = 1.0;
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        const audioPromise = audio.play();
        if (audioPromise !== undefined) {
          audioPromise
            .then(() => {
              setIsAudioLocked(false);
            })
            .catch((err) => {
              console.warn('[WebRTC] Remote audio autoplay blocked (tap to unmute needed):', err);
              setIsAudioLocked(true);
            });
        }
      }

      setSessionState('connected');
      setStatusMessage('Connected!');
    }
  }, [remoteStream]);

  // Global document interaction listener to unlock audio seamlessly on any user touch/click
  useEffect(() => {
    const handleDocumentInteraction = () => {
      if (remoteAudioRef.current && isAudioLocked) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.play().then(() => {
          setIsAudioLocked(false);
        }).catch(() => {});
      }
    };
    window.addEventListener('click', handleDocumentInteraction, { passive: true });
    window.addEventListener('touchstart', handleDocumentInteraction, { passive: true });
    return () => {
      window.removeEventListener('click', handleDocumentInteraction);
      window.removeEventListener('touchstart', handleDocumentInteraction);
    };
  }, [isAudioLocked]);

  // Audio unlocker function for mobile browsers
  const unlockAudio = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.play().catch(() => {});
    }
    setIsAudioLocked(false);
  }, []);

  // Step 1: Initialize local media (camera+mic or mic-only) on mount
  useEffect(() => {
    let mounted = true;
    if (initialLocalStream && initialLocalStream.active) {
      setSessionState('searching');
      setStatusMessage(callMode === 'audio' ? 'Searching for someone to talk to (Audio)...' : 'Looking for someone to talk to...');
      return;
    }

    initLocalStream(facingMode, callMode === 'audio').then((stream) => {
      if (mounted) {
        if (stream) {
          setSessionState('searching');
          setStatusMessage(callMode === 'audio' ? 'Searching for someone to talk to (Audio)...' : 'Looking for someone to talk to...');
        } else {
          setStatusMessage(callMode === 'audio' ? 'Microphone access required. Please grant permission.' : 'Camera access required. Please grant permission.');
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [initLocalStream, initialLocalStream, facingMode, callMode]);

  // Step 2: Trigger search once media is ready and Socket is connected
  useEffect(() => {
    if (sessionState === 'searching' && isSocketConnected && !roomId && localStream) {
      console.log(`[Roulette Stage] ${callMode === 'audio' ? 'Mic' : 'Camera'} & Socket ready. Joining matchmaking queue (mode: ${callMode})...`);
      socketJoinQueue(recentPeersRef.current, initialUserMeta, callMode);
    }
  }, [sessionState, isSocketConnected, roomId, localStream, socketJoinQueue, initialUserMeta, callMode]);

  // Rotate quotes every 3.5s while searching
  useEffect(() => {
    if (sessionState !== 'searching') return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % SEARCHING_QUOTES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [sessionState]);

  // Skip / Next Peer Action (with 800ms debounce guard)
  const triggerSkip = useCallback((isRemoteSkip = false) => {
    if (isSkippingRef.current) return;
    isSkippingRef.current = true;
    setTimeout(() => {
      isSkippingRef.current = false;
    }, 800);

    const currentRoom = roomIdRef.current;
    const currentPartner = partnerIdRef.current;

    if (!isRemoteSkip && currentRoom) {
      socketSkip(currentRoom);
    }

    cleanupPeerConnection();

    let updatedRecents = recentPeersRef.current;
    if (currentPartner) {
      updatedRecents = [currentPartner, ...recentPeersRef.current.filter((p) => p !== currentPartner).slice(0, 4)];
      setRecentPeers(updatedRecents);
      recentPeersRef.current = updatedRecents;
    }

    setRoomId(null);
    setPartnerId(null);
    setPartnerMeta(null);
    setRole(null);
    setTimeLeft(defaultTimerDuration);
    setHasRequestedTime(false);
    setPeerRequestedTime(false);
    setShowPartnerDossier(false);
    setSessionState('searching');
    setStatusMessage(callMode === 'audio' ? 'Searching for an audio conversation...' : 'Searching for someone to talk to...');

    setTimeout(() => {
      socketJoinQueue(updatedRecents, initialUserMeta, callMode);
    }, 300);
  }, [socketSkip, cleanupPeerConnection, defaultTimerDuration, socketJoinQueue, initialUserMeta, callMode]);

  // Session Countdown Timer (Monkey.app 30-sec ticking timer)
  // ONLY counts down when both peers are connected and remote media stream is active
  useEffect(() => {
    // Media is truly active when remote stream has at least one live track
    const hasLiveAudio = remoteStream?.getAudioTracks().some((t) => t.readyState === 'live');
    const hasLiveVideo = remoteStream?.getVideoTracks().some((t) => t.readyState === 'live');
    const isMediaActive = callMode === 'audio' ? hasLiveAudio : (hasLiveVideo || hasLiveAudio);

    if (sessionState !== 'connected' || !remoteStream || !isMediaActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerSkip(false); // Time expired: auto-advance to next match!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionState, remoteStream, callMode, triggerSkip]);

  // Single Press +Time Handler (Artist Discretion & Economics)
  const handleAddTimePress = async () => {
    if (!roomId || hasRequestedTime || isProcessingPayment) return;
    unlockAudio();

    // Case 1: Partner is a paid artist and caller hasn't enough credits
    if (currentCost > 0 && !peerRequestedTime) {
      if (walletBalance < currentCost) {
        setLowBalanceAlert(true);
        setTimeout(() => setLowBalanceAlert(false), 4000);
        return;
      }
    }

    setHasRequestedTime(true);

    // Check if caller has sufficient token balance
    if (walletBalance < currentCost) {
      setLowBalanceAlert(true);
      setTimeout(() => setLowBalanceAlert(false), 4000);
      return;
    }

    setHasRequestedTime(true);

    // If other person already requested: this press accepts and pays tokens
    if (peerRequestedTime) {
      try {
        setIsProcessingPayment(true);
        fetch('/api/roulette/extend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorEmail: partnerMeta?.creatorEmail,
            creatorUsername: partnerMeta?.username,
            amount: currentCost || 10,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.success && typeof data.newBalance === 'number') {
              setWalletBalance(data.newBalance);
            }
          })
          .catch((err) => console.log('[Extend payment non-blocking]', err));

        // Always accept and extend the session
        socketAcceptTimeExtension(roomId, currentCost || 10, 30);
      } catch (e) {
        console.error('[Supertalks] Extension error:', e);
        socketAcceptTimeExtension(roomId, currentCost || 10, 30);
      } finally {
        setIsProcessingPayment(false);
      }
    } else {
      // First press: announce extension request with token pricing
      socketRequestTimeExtension(roomId, currentCost || 10, 30);
    }
  };

  // Floating Emoji Reaction
  const sendReaction = (emoji: string) => {
    triggerFloatingEmoji(emoji);
    if (roomId) {
      socketSendReaction(emoji, roomId);
    }
  };

  const triggerFloatingEmoji = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = Math.floor(Math.random() * 60) + 20; // 20% to 80% width
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  };

  // Format Timer mm:ss
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white select-none overflow-hidden h-[100dvh]">
      {/* Real-time Online Count Indicator */}
      <div className="absolute top-4 left-4 z-40 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-xs text-neutral-300 pointer-events-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-semibold text-white">{(onlineCount || 1420).toLocaleString()}</span>
        <span className="text-neutral-400">online</span>
      </div>

      {/* Floating Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 shadow-xl transition-all active:scale-95 cursor-pointer"
          title="Exit Supertalks"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Floating Countdown Clock */}
      {sessionState === 'connected' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/10 shadow-xl backdrop-blur-md">
            <Clock className={`w-3.5 h-3.5 ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-neutral-300'}`} />
            <span
              className={`font-mono text-sm font-black tracking-widest ${
                timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-white'
              }`}
            >
              {formatTimer(timeLeft)}
            </span>
          </div>
        </div>
      )}

      {/* Main Dual Video Canvas */}
      <div className="flex-1 flex flex-col md:flex-row w-full h-full relative">
        {/* Remote Video (Stranger / Artist) */}
        <div 
          onClick={unlockAudio}
          className="flex-1 relative flex items-center justify-center bg-neutral-900 overflow-hidden border-b md:border-b-0 md:border-r border-neutral-800 cursor-pointer"
        >
          <audio ref={remoteAudioRef} autoPlay playsInline />

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Audio-Only Mode Voice Stage for Remote Peer */}
          {callMode === 'audio' && remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 z-15 p-6 text-center select-none">
              <div className="relative flex items-center justify-center mb-6">
                <div className="w-44 h-44 rounded-full bg-emerald-500/10 animate-ping absolute" />
                <div className="w-36 h-36 rounded-full bg-emerald-500/15 animate-pulse absolute" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl relative z-10 border-2 border-white/20">
                  {partnerMeta?.isCreator ? '🎨' : (partnerMeta?.displayName || partnerMeta?.username || 'S')[0].toUpperCase()}
                </div>
              </div>

              <div className="space-y-2 z-10">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {partnerMeta?.displayName || partnerMeta?.username || 'Stranger'}
                  </h3>
                  {partnerMeta?.isCreator && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      Creator
                    </span>
                  )}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Voice · Audio Supertalk</span>
                </div>
              </div>
            </div>
          )}

          {/* Tap to Unmute Banner */}
          {isAudioLocked && sessionState === 'connected' && (
            <div className="absolute top-16 inset-x-4 flex justify-center z-40 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  unlockAudio();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs shadow-2xl flex items-center gap-1.5 animate-bounce active:scale-95 transition-transform cursor-pointer"
              >
                <Volume2 className="w-4 h-4 fill-current" />
                Tap to Unmute Audio 🔊
              </button>
            </div>
          )}

          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center p-6 max-w-sm mx-auto z-10 bg-neutral-900">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  {sessionState === 'connecting' ? '⚡' : '🔍'}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-base font-semibold text-neutral-200">{statusMessage}</p>
                <p className="text-xs text-neutral-400">
                  {sessionState === 'searching'
                    ? 'Matching you with creators and people worldwide...'
                    : 'Establishing peer-to-peer encryption...'}
                </p>
              </div>

              {/* Dynamic Searching Quotes Carousel */}
              {sessionState === 'searching' && (
                <div className="w-full mt-2 min-h-[96px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={quoteIndex}
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.96 }}
                      transition={{ duration: 0.4 }}
                      className="w-full p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-xl text-center"
                    >
                      <p className="text-xs italic text-neutral-200 font-serif leading-relaxed">
                        &ldquo;{SEARCHING_QUOTES[quoteIndex].text}&rdquo;
                      </p>
                      <p className="text-[10px] text-amber-400 font-sans font-bold mt-2 tracking-widest uppercase">
                        — {SEARCHING_QUOTES[quoteIndex].author}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* Partner Status Overlay Tag */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-left">
            <span
              className={`w-2 h-2 rounded-full ${
                sessionState === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : sessionState === 'connecting'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-neutral-500'
              }`}
            />
            <span className="font-semibold text-neutral-200">
              {partnerMeta?.isCreator ? `🎨 ${partnerMeta.displayName || partnerMeta.username}` : 'Stranger'}
            </span>
            {partnerMeta?.isCreator && (partnerMeta.videoRate || 0) > 0 && (
              <span className="text-[10px] text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
                ₹{partnerMeta.videoRate}/m
              </span>
            )}
          </div>



          {/* Remote Audio Meter */}
          {remoteStream && (
            <AudioMeter
              stream={remoteStream}
              className="absolute bottom-4 right-4 z-20"
            />
          )}
        </div>

        {/* Local Video (Self Preview) */}
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Audio-Only Mode Voice Stage for Local User */}
          {callMode === 'audio' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 z-20 p-6 text-center select-none">
              <div className="relative flex items-center justify-center mb-5">
                <div className="w-32 h-32 rounded-full bg-blue-500/10 animate-pulse absolute" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl relative z-10 border border-white/20">
                  You
                </div>
              </div>
              <p className="text-base font-bold text-white">Your Voice</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-neutral-300">
                {isAudioMuted ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Microphone Muted (Tap mic to speak)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Microphone Live 🎙️</span>
                  </>
                )}
              </div>
            </div>
          )}

          {!localStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-950 z-30">
              {hasCameraPermission === false ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-3">
                    <VideoOff className="w-7 h-7 text-rose-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Camera Access Required</h3>
                  <p className="text-xs text-neutral-400 max-w-xs mb-3">
                    Supertalks requires camera and microphone access to connect you with peers.
                  </p>
                  {rtcError && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 font-mono max-w-xs break-all text-left">
                      <span className="font-bold text-rose-400">Diag: </span>
                      {rtcError}
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      setIsRetryingCam(true);
                      try {
                        await initLocalStream();
                      } finally {
                        setIsRetryingCam(false);
                      }
                    }}
                    disabled={isRetryingCam}
                    className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 active:scale-95 transition-all shadow-lg shadow-white/10 mb-3 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isRetryingCam && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isRetryingCam ? 'Requesting Camera...' : 'Enable Camera & Mic'}</span>
                  </button>
                  <p className="text-[11px] text-neutral-500 max-w-xs leading-normal">
                    💡 If using Expo Go or Android WebView, please test directly in <span className="text-amber-400 font-semibold">Chrome or Safari</span> via your browser for full native WebRTC camera support.
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                  <p className="text-sm font-medium text-neutral-300">Starting your camera...</p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                    Please grant camera & microphone permissions when prompted.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Local User Tag */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-medium text-neutral-300">You</span>
            {walletBalance > 0 && (
              <span className="text-[10px] text-neutral-400">
                (₹{walletBalance})
              </span>
            )}
          </div>

          {/* Local Audio Meter & Active Users Count */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 pointer-events-none select-none">
            {/* Live Active Users Count */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tabular-nums font-bold text-xs text-emerald-400">
                {onlineCount}
              </span>
              <span className="text-[10px] text-neutral-300 font-medium">
                {onlineCount === 1 ? 'user online' : 'active users'}
              </span>
            </div>

            {/* Audio Meter */}
            {localStream && (
              <AudioMeter
                stream={localStream}
                isMuted={isAudioMuted}
              />
            )}
          </div>
        </div>

        {/* Floating Emojis */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          <AnimatePresence>
            {floatingEmojis.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 1, y: '80%', x: `${item.x}%`, scale: 0.5 }}
                animate={{ opacity: 0, y: '10%', scale: 1.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
                className="absolute text-5xl select-none"
              >
                {item.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Audio Route Toast Notification */}
        <AnimatePresence>
          {audioOutputToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute top-20 inset-x-0 flex justify-center z-50 pointer-events-none"
            >
              <div className="px-4 py-2 rounded-full bg-neutral-900/95 text-white font-semibold text-xs shadow-2xl border border-white/20 backdrop-blur-md flex items-center gap-2">
                <span>{audioOutputToast}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time Extended Celebration Banner */}
        <AnimatePresence>
          {showExtensionAlert && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
            >
              <div className="px-6 py-3 rounded-2xl bg-amber-500/95 text-neutral-950 font-black text-lg shadow-2xl flex items-center gap-2 backdrop-blur-md">
                <Sparkles className="w-6 h-6 fill-current animate-spin" />
                <span>{extensionMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Low Balance Alert Modal */}
        <AnimatePresence>
          {lowBalanceAlert && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-x-4 top-24 z-50 flex justify-center"
            >
              <div className="p-4 rounded-2xl bg-neutral-900 border border-amber-500/50 shadow-2xl max-w-sm text-center">
                <Coins className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-white">Insufficient Balance</h3>
                <p className="text-xs text-neutral-400 mt-1 mb-3">
                  This extension costs {currentCost} tokens. Your balance is {walletBalance} tokens.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLowBalanceAlert(false)}
                    className="flex-1 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <Link
                    href="/dashboard?tab=wallet"
                    target="_blank"
                    className="flex-1 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Top Up
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Control Dock */}
      <footer className="relative z-40 flex items-center justify-between p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-md pb-6 md:pb-4">
        {/* Left: Media Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-all active:scale-95 ${
              isAudioMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-neutral-800/80 text-white hover:bg-neutral-700'
            }`}
            title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Speaker / Earpiece Toggle Button */}
          <button
            onClick={toggleAudioOutput}
            className={`p-3 rounded-full transition-all active:scale-95 flex items-center gap-1.5 ${
              audioOutputRoute === 'earpiece'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-neutral-800/80 text-white hover:bg-neutral-700'
            }`}
            title={audioOutputRoute === 'earpiece' ? 'Audio Route: Earpiece (Click for Speaker)' : 'Audio Route: Speaker (Click for Earpiece)'}
          >
            {audioOutputRoute === 'earpiece' ? (
              <Phone className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
            <span className="text-[11px] font-semibold pr-0.5 hidden sm:inline">
              {audioOutputRoute === 'earpiece' ? 'Earpiece' : 'Speaker'}
            </span>
          </button>

          {callMode === 'video' && (
            <>
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all active:scale-95 ${
                  isVideoMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-neutral-800/80 text-white hover:bg-neutral-700'
                }`}
                title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
              </button>

              <button
                onClick={flipCamera}
                className="p-3 rounded-full bg-neutral-800/80 text-white hover:bg-neutral-700 active:scale-95 transition-all"
                title="Flip Camera (Front/Back)"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Center: Emoji Reactions */}
        {sessionState === 'connected' && (
          <div className="flex items-center gap-1.5 bg-neutral-900/80 px-2 py-1 rounded-full border border-neutral-800">
            {['🔥', '❤️', '😂', '👏'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Right: +Time Press & Skip Buttons */}
        <div className="flex items-center gap-2">
          {sessionState === 'connected' && (
            <button
              onClick={handleAddTimePress}
              disabled={hasRequestedTime || isProcessingPayment}
              className={`px-3.5 py-2.5 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 border ${
                peerRequestedTime && !hasRequestedTime
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-sm'
                  : hasRequestedTime
                  ? 'bg-neutral-900/60 text-neutral-400 border-neutral-800 cursor-default'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700/80 shadow-sm'
              }`}
            >
              {isProcessingPayment ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>
                {hasRequestedTime
                  ? 'Waiting...'
                  : peerRequestedTime
                  ? `Accept (-${currentCost} Tokens)`
                  : `+30s (${currentCost} Tokens)`}
              </span>
            </button>
          )}

          <button
            onClick={() => triggerSkip(false)}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-neutral-950 font-black text-sm flex items-center gap-1.5 shadow-xl active:scale-95 transition-all"
          >
            <span>Next</span>
            <FastForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </footer>
    </div>
  );
}
