import io, { Socket } from 'socket.io-client';

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

export type SocketCallbacks = {
  onMatched?: (data: MatchedEvent) => void;
  onQueued?: (data: { queueLength: number }) => void;
  onSignal?: (data: SignalEvent) => void;
  onPeerSkipped?: () => void;
  onPeerLeft?: () => void;
  onPeerRequestedTime?: (payload: { cost?: number; seconds?: number }) => void;
  onTimeExtended?: (data: { addedSeconds: number; cost?: number }) => void;
  onOnlineCount?: (count: number) => void;
};

class NativeSignalingService {
  private socket: Socket | null = null;
  private callbacks: SocketCallbacks = {};
  private activeRoomId: string | null = null;

  connect(serverUrl: string, callbacks: SocketCallbacks) {
    this.callbacks = callbacks;

    if (this.socket) {
      this.socket.disconnect();
    }

    console.log('[Native Signaling] Connecting to:', serverUrl);

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Native Signaling] Connected! Socket ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Native Signaling] Connection error:', err.message);
    });

    this.socket.on('matched', (data: MatchedEvent) => {
      console.log('[Native Signaling] Matched received:', data);
      this.activeRoomId = data.roomId;
      this.callbacks.onMatched?.(data);
    });

    this.socket.on('queued', (data: { queueLength: number }) => {
      console.log('[Native Signaling] Queued event received:', data);
      this.callbacks.onQueued?.(data);
    });

    this.socket.on('signal', (data: SignalEvent) => {
      this.callbacks.onSignal?.(data);
    });

    this.socket.on('peer_skipped', () => {
      this.activeRoomId = null;
      this.callbacks.onPeerSkipped?.();
    });

    this.socket.on('peer_left', () => {
      this.activeRoomId = null;
      this.callbacks.onPeerLeft?.();
    });

    this.socket.on('peer_requested_time', (payload) => {
      this.callbacks.onPeerRequestedTime?.(payload);
    });

    this.socket.on('time_extended', (data) => {
      this.callbacks.onTimeExtended?.(data);
    });

    this.socket.on('online_count', (data: { count: number }) => {
      if (typeof data?.count === 'number') {
        this.callbacks.onOnlineCount?.(data.count);
      }
    });
  }

  joinQueue(userMeta: { peerId: string; mode: 'video' | 'audio'; isCreator?: boolean; username?: string }) {
    if (!this.socket) {
      console.warn('[Native Signaling] Cannot join queue: socket not initialized');
      return;
    }
    if (!this.socket.connected) {
      console.log('[Native Signaling] Socket not connected yet, connecting and queuing upon connection...');
      this.socket.connect();
      this.socket.once('connect', () => {
        console.log('[Native Signaling] Connected! Emitting join_queue:', userMeta);
        this.socket?.emit('join_queue', userMeta);
      });
      return;
    }
    console.log('[Native Signaling] Emitting join_queue directly:', userMeta);
    this.socket.emit('join_queue', userMeta);
  }

  leaveQueue() {
    if (!this.socket?.connected) return;
    this.socket.emit('leave_queue');
  }

  sendSignal(roomId: string, type: 'offer' | 'answer' | 'candidate', data: any) {
    if (!this.socket?.connected) return;
    this.socket.emit('signal', { roomId, type, data });
  }

  skip(roomId?: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('skip', { roomId: roomId || this.activeRoomId });
    this.activeRoomId = null;
  }

  requestTimeExtension(roomId: string, cost = 10, seconds = 30) {
    if (!this.socket?.connected) return;
    this.socket.emit('request_time_extension', { roomId, cost, seconds, amountSeconds: seconds });
  }

  acceptTimeExtension(roomId: string, cost = 10, seconds = 30) {
    if (!this.socket?.connected) return;
    this.socket.emit('accept_time_extension', { roomId, cost, seconds, amountSeconds: seconds });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const nativeSignaling = new NativeSignalingService();
