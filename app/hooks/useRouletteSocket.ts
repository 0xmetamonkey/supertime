'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface PartnerMeta {
  isCreator: boolean;
  username: string;
  creatorEmail: string;
  videoRate: number;
  displayName: string;
}

export interface MatchedEvent {
  roomId: string;
  partnerId: string;
  role: 'initiator' | 'receiver';
  mode?: 'video' | 'audio';
  partnerMeta?: PartnerMeta;
}

export interface SignalEvent {
  type: 'offer' | 'answer' | 'candidate';
  data: any;
  fromSocketId: string;
}

interface UseRouletteSocketProps {
  serverUrl?: string;
  peerId: string;
  onMatched?: (match: MatchedEvent) => void;
  onSignal?: (signal: SignalEvent) => void;
  onPeerSkipped?: () => void;
  onPeerLeft?: () => void;
  onPeerRequestedTime?: (payload: { cost: number; seconds: number }) => void;
  onTimeExtended?: (payload: { addedSeconds: number; cost?: number }) => void;
  onReaction?: (payload: { emoji: string }) => void;
  onQueued?: (payload: { queueLength: number }) => void;
}

export function useRouletteSocket({
  serverUrl,
  peerId,
  onMatched,
  onSignal,
  onPeerSkipped,
  onPeerLeft,
  onPeerRequestedTime,
  onTimeExtended,
  onReaction,
  onQueued,
}: UseRouletteSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1420);

  // Fetch real-time online pool metrics immediately on mount
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

  // Store callbacks in refs to avoid reconnection cycles
  const callbacksRef = useRef({
    onMatched,
    onSignal,
    onPeerSkipped,
    onPeerLeft,
    onPeerRequestedTime,
    onTimeExtended,
    onReaction,
    onQueued,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMatched,
      onSignal,
      onPeerSkipped,
      onPeerLeft,
      onPeerRequestedTime,
      onTimeExtended,
      onReaction,
      onQueued,
    };
  }, [
    onMatched,
    onSignal,
    onPeerSkipped,
    onPeerLeft,
    onPeerRequestedTime,
    onTimeExtended,
    onReaction,
    onQueued,
  ]);

  // Determine socket endpoint
  const getSocketUrl = useCallback(() => {
    if (serverUrl) return serverUrl;
    if (process.env.NEXT_PUBLIC_ROULETTE_SOCKET_URL) {
      return process.env.NEXT_PUBLIC_ROULETTE_SOCKET_URL;
    }
    if (typeof window !== 'undefined') {
      const { hostname, origin } = window.location;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local')
      ) {
        return `http://${hostname}:3001`;
      }
      return origin;
    }
    return 'http://localhost:3001';
  }, [serverUrl]);

  useEffect(() => {
    const targetUrl = getSocketUrl();
    console.log('[Roulette Socket] Connecting to:', targetUrl);

    const socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Roulette Socket] Connected. Socket ID:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Roulette Socket] Disconnected:', reason);
      setIsConnected(false);
      setActiveRoomId(null);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Roulette Socket] Connection error:', err.message);
    });

    socket.on('matched', (data: MatchedEvent) => {
      console.log('[Roulette Socket] Matched event:', data);
      setActiveRoomId(data.roomId);
      callbacksRef.current.onMatched?.(data);
    });

    socket.on('queued', (data: { queueLength: number }) => {
      callbacksRef.current.onQueued?.(data);
    });

    socket.on('signal', (data: SignalEvent) => {
      callbacksRef.current.onSignal?.(data);
    });

    socket.on('peer_skipped', () => {
      console.log('[Roulette Socket] Peer skipped');
      setActiveRoomId(null);
      callbacksRef.current.onPeerSkipped?.();
    });

    socket.on('peer_left', () => {
      console.log('[Roulette Socket] Peer left');
      setActiveRoomId(null);
      callbacksRef.current.onPeerLeft?.();
    });

    socket.on('peer_requested_time', (payload: { cost?: number; seconds?: number } = {}) => {
      callbacksRef.current.onPeerRequestedTime?.({
        cost: payload.cost || 0,
        seconds: payload.seconds || 30,
      });
    });

    socket.on('time_extended', (data: { addedSeconds: number; cost?: number }) => {
      callbacksRef.current.onTimeExtended?.(data);
    });

    socket.on('reaction', (data: { emoji: string }) => {
      callbacksRef.current.onReaction?.(data);
    });

    socket.on('online_count', (data: { count: number }) => {
      if (typeof data?.count === 'number') {
        setOnlineCount(Math.max(1, data.count));
      }
    });

    return () => {
      console.log('[Roulette Socket] Disconnecting socket...');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [getSocketUrl]);

  const joinQueue = useCallback((recentPeers: string[] = [], meta?: Partial<PartnerMeta>, mode: 'video' | 'audio' = 'video') => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('[Roulette Socket] Cannot join queue: socket not connected');
      return;
    }
    console.log('[Roulette Socket] Emitting join_queue with peerId:', peerId, 'mode:', mode);
    socketRef.current.emit('join_queue', {
      peerId,
      recentPeers,
      mode,
      ...meta,
    });
  }, [peerId]);

  const sendSignal = useCallback((roomId: string, type: 'offer' | 'answer' | 'candidate', data: any) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit('signal', { roomId, type, data });
  }, []);

  const skip = useCallback((roomId?: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    const targetRoom = roomId || activeRoomId;
    socketRef.current.emit('skip', { roomId: targetRoom });
    setActiveRoomId(null);
  }, [activeRoomId]);

  const requestTimeExtension = useCallback((roomId?: string, cost: number = 0, amountSeconds: number = 30) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    const targetRoom = roomId || activeRoomId;
    socketRef.current.emit('request_time_extension', { roomId: targetRoom, cost, amountSeconds });
  }, [activeRoomId]);

  const acceptTimeExtension = useCallback((roomId?: string, cost: number = 0, amountSeconds: number = 30) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    const targetRoom = roomId || activeRoomId;
    socketRef.current.emit('accept_time_extension', { roomId: targetRoom, cost, amountSeconds });
  }, [activeRoomId]);

  const sendReaction = useCallback((emoji: string, roomId?: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    const targetRoom = roomId || activeRoomId;
    socketRef.current.emit('reaction', { roomId: targetRoom, emoji });
  }, [activeRoomId]);

  return {
    socket: socketRef.current,
    isConnected,
    activeRoomId,
    joinQueue,
    sendSignal,
    skip,
    requestTimeExtension,
    acceptTimeExtension,
    sendReaction,
    onlineCount,
  };
}
