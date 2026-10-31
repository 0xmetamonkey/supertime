'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseWebRTCOptions {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  iceServers?: RTCConfiguration;
  initialStream?: MediaStream | null;
  mode?: 'video' | 'audio';
}

const DEFAULT_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.relay.metered.ca:80' },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(options?: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(() => {
    if (options?.initialStream && options.initialStream.active) {
      return options.initialStream;
    }
    return null;
  });
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(() => {
    if (options?.initialStream && options.initialStream.active) {
      return true;
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(options?.initialStream || null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (options?.initialStream && options.initialStream.active) {
      localStreamRef.current = options.initialStream;
      setLocalStream(options.initialStream);
      setHasCameraPermission(true);
    }
  }, [options?.initialStream]);

  // Initialize or fetch local user media (camera + mic OR audio-only)
  const initLocalStream = useCallback(async (desiredFacingMode = facingMode, overrideAudioOnly?: boolean) => {
    try {
      if (typeof window === 'undefined') return null;

      const isAudioOnly = overrideAudioOnly ?? (optionsRef.current?.mode === 'audio');

      // Fast-path: if stream was already provided and active, reuse it
      if (
        localStreamRef.current &&
        localStreamRef.current.active &&
        (isAudioOnly ? localStreamRef.current.getAudioTracks().length > 0 : localStreamRef.current.getVideoTracks().length > 0)
      ) {
        setHasCameraPermission(true);
        setLocalStream(localStreamRef.current);
        return localStreamRef.current;
      }

      const mediaDevices = navigator.mediaDevices || (navigator as any).webkitGetUserMedia;
      if (!mediaDevices || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Media access is not supported by this browser. Please open in Chrome or Safari.');
      }

      // Stop existing tracks if switching media mode or camera
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      let stream: MediaStream | null = null;

      if (isAudioOnly) {
        // Pure audio capture — no camera turned on, zero battery/camera strain
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      } else {
        // Primary Strategy: Request both video & audio together.
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: desiredFacingMode,
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (errCombined) {
          console.warn('[WebRTC] Preferred video+audio failed, trying basic video+audio...', errCombined);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          } catch (errRelaxed) {
            console.warn('[WebRTC] Basic video+audio failed, falling back to video-only...', errRelaxed);
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: desiredFacingMode },
              });
            } catch (errVideoFacing) {
              console.warn('[WebRTC] Video with facingMode failed, trying unconstrained video...', errVideoFacing);
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
              });
            }
          }
        }
      }

      if (!stream) {
        throw new Error(isAudioOnly ? 'Unable to capture microphone.' : 'Unable to capture camera stream.');
      }

      // If video-only fallback succeeded, attempt to attach audio non-blockingly
      if (stream.getAudioTracks().length === 0) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioTrack = audioStream.getAudioTracks()[0];
          if (audioTrack && stream.active) {
            stream.addTrack(audioTrack);
          }
        } catch (audioErr) {
          console.warn('[WebRTC] Optional audio track attachment failed:', audioErr);
        }
      }

      // Render local media
      localStreamRef.current = stream;
      setLocalStream(stream);
      setHasCameraPermission(true);
      setError(null);

      return stream;
    } catch (err: unknown) {
      let errMsg = 'Camera / Microphone access denied';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errMsg = 'Permission blocked. Click the tune/lock icon in your browser address bar and set Camera & Mic to "Allow".';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errMsg = 'No camera or microphone found on your device.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errMsg = 'Camera/Mic is currently in use by another app or phone call. Please close other apps and retry.';
        } else {
          errMsg = `${err.name}: ${err.message}`;
        }
      }
      console.error('[WebRTC] Error acquiring media stream:', err);
      setHasCameraPermission(false);
      setError(errMsg);
      return null;
    }
  }, [facingMode]);

  // Clean up RTCPeerConnection safely
  const cleanupPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);
    pendingCandidatesRef.current = [];
    setConnectionState('closed');
  }, []);

  // Create a new RTCPeerConnection instance (forceNew wipes any stale session)
  const createPeerConnection = useCallback((forceNew = false) => {
    if (!forceNew && pcRef.current && pcRef.current.signalingState !== 'closed') {
      return pcRef.current;
    }

    if (pcRef.current) {
      try {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    const config = optionsRef.current?.iceServers || DEFAULT_ICE_SERVERS;
    const pc = new RTCPeerConnection(config);
    pcRef.current = pc;

    // Send local ICE candidates to remote peer via signaling callback
    pc.onicecandidate = (event) => {
      if (event.candidate && optionsRef.current?.onIceCandidate) {
        optionsRef.current.onIceCandidate(event.candidate);
      }
    };

    // Receive remote tracks and attach to remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind, event.track.id, 'enabled:', event.track.enabled);
      event.track.enabled = true;

      // Prefer native synchronized MediaStream if provided by browser
      let streamToUse: MediaStream;
      if (event.streams && event.streams[0]) {
        streamToUse = event.streams[0];
        remoteStreamRef.current = streamToUse;
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        if (!remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id)) {
          remoteStreamRef.current.addTrack(event.track);
        }
        streamToUse = remoteStreamRef.current;
      }

      setRemoteStream(streamToUse);
      setConnectionState('connected');
    };

    // Monitor connection health
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('[WebRTC] Connection state changed:', state);
      setConnectionState(state);
      if (optionsRef.current?.onConnectionStateChange) {
        optionsRef.current.onConnectionStateChange(state);
      }
    };

    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      console.log('[WebRTC] ICE connection state changed:', iceState);
      if (iceState === 'connected' || iceState === 'completed') {
        setConnectionState('connected');
        if (optionsRef.current?.onConnectionStateChange) {
          optionsRef.current.onConnectionStateChange('connected');
        }
      }
    };

    // Attach local media tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  }, [cleanupPeerConnection]);

  // Create an SDP offer (Initiator role)
  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    try {
      const pc = createPeerConnection(true);

      // Ensure local tracks are attached before creating offer
      if (localStreamRef.current) {
        const senders = pc.getSenders();
        localStreamRef.current.getTracks().forEach((track) => {
          const exists = senders.some((s) => s.track === track);
          if (!exists) {
            pc.addTrack(track, localStreamRef.current!);
          }
        });
      }

      const isAudioOnly = optionsRef.current?.mode === 'audio';
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: !isAudioOnly,
      });
      await pc.setLocalDescription(offer);
      console.log(`[WebRTC] Created and set local offer (mode: ${isAudioOnly ? 'audio' : 'video'})`);
      return offer;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create offer';
      console.error('[WebRTC] Error creating offer:', err);
      setError(errMsg);
      return null;
    }
  }, [createPeerConnection]);

  // Handle incoming SDP offer and return SDP answer (Receiver role)
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> => {
    try {
      const pc = createPeerConnection(true);

      // Ensure local tracks are attached before creating answer
      if (localStreamRef.current) {
        const senders = pc.getSenders();
        localStreamRef.current.getTracks().forEach((track) => {
          const exists = senders.some((s) => s.track === track);
          if (!exists) {
            pc.addTrack(track, localStreamRef.current!);
          }
        });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] Set remote offer');

      // Process any candidates that arrived before the offer was set
      while (pendingCandidatesRef.current.length > 0) {
        const candidate = pendingCandidatesRef.current.shift();
        if (candidate && candidate.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('[WebRTC] Queued ICE candidate addition warning:', e);
          }
        }
      }

      const isAudioOnly = optionsRef.current?.mode === 'audio';
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: !isAudioOnly,
      });
      await pc.setLocalDescription(answer);
      console.log(`[WebRTC] Created and set local answer (mode: ${isAudioOnly ? 'audio' : 'video'})`);
      return answer;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to handle offer';
      console.error('[WebRTC] Error handling offer:', err);
      setError(errMsg);
      return null;
    }
  }, [createPeerConnection]);

  // Handle incoming SDP answer (Initiator receives answer from Receiver)
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      const pc = pcRef.current;
      if (!pc) throw new Error('PeerConnection does not exist to accept answer');
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] Set remote answer');

      // Process queued candidates
      while (pendingCandidatesRef.current.length > 0) {
        const candidate = pendingCandidatesRef.current.shift();
        if (candidate && candidate.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('[WebRTC] Queued ICE candidate addition warning:', e);
          }
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to handle answer';
      console.error('[WebRTC] Error handling answer:', err);
      setError(errMsg);
    }
  }, []);

  // Handle incoming remote ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      if (!candidate || !candidate.candidate) return;
      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Remote description not ready yet, queue candidate
        pendingCandidatesRef.current.push(candidate);
      }
    } catch (err) {
      console.warn('[WebRTC] Warning adding ICE candidate:', err);
    }
  }, []);

  // Controls: Toggle Audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Controls: Toggle Video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, []);

  // Controls: Flip camera (ideal for mobile phone testing)
  const flipCamera = useCallback(async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    const newStream = await initLocalStream(nextMode);

    // Replace video track on active peer connection if connected
    if (newStream && pcRef.current) {
      const newVideoTrack = newStream.getVideoTracks()[0];
      const senders = pcRef.current.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === 'video');
      if (videoSender && newVideoTrack) {
        await videoSender.replaceTrack(newVideoTrack);
      }
    }
  }, [facingMode, initLocalStream]);

  // Total teardown on unmount
  useEffect(() => {
    return () => {
      cleanupPeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cleanupPeerConnection]);

  return {
    localStream,
    remoteStream,
    connectionState,
    isAudioMuted,
    isVideoMuted,
    facingMode,
    hasCameraPermission,
    error,
    initLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupPeerConnection,
    toggleAudio,
    toggleVideo,
    flipCamera,
  };
}
