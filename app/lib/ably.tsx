'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import Ably from 'ably';

interface AblyContextType {
  client: Ably.Realtime | null;
  isConnected: boolean;
  subscribe: (channelName: string, callback: (message: Ably.Message) => void) => () => void;
  publish: (channelName: string, eventName: string, data: any) => Promise<void>;
  enterPresence: (channelName: string, data?: any) => Promise<void>;
  leavePresence: (channelName: string) => Promise<void>;
  getPresence: (channelName: string) => Promise<Ably.PresenceMessage[]>;
}

const AblyContext = createContext<AblyContextType | null>(null);

interface AblyProviderProps {
  children: ReactNode;
  clientId: string;
}

export function AblyProvider({ children, clientId }: AblyProviderProps) {
  const [client, setClient] = useState<Ably.Realtime | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!clientId) {
      console.log('[Ably] Waiting for clientId...');
      return;
    }

    const normalizedClientId = clientId.toLowerCase();
    console.log('[Ably] Initializing client for:', normalizedClientId);

    const ablyClient = new Ably.Realtime({
      authUrl: `/api/ably/token?clientId=${encodeURIComponent(normalizedClientId)}`,
      authMethod: 'GET',
    });

    ablyClient.connection.on('connected', () => {
      console.log('[Ably] Connected');
      setIsConnected(true);
    });

    ablyClient.connection.on('disconnected', () => {
      console.log('[Ably] Disconnected');
      setIsConnected(false);
    });

    ablyClient.connection.on('failed', (err) => {
      console.error('[Ably] Connection failed:', err);
      setIsConnected(false);
    });

    setClient(ablyClient);

    return () => {
      console.log('[Ably] Closing connection');
      ablyClient.close();
    };
  }, [clientId]);

  const subscribe = useCallback((channelName: string, callback: (message: Ably.Message) => void) => {
    if (!client) return () => { };

    const channel = client.channels.get(channelName);
    channel.subscribe(callback);

    return () => {
      channel.unsubscribe(callback);
    };
  }, [client]);

  const publish = useCallback(async (channelName: string, eventName: string, data: any) => {
    if (!client) throw new Error('Ably not connected');

    const channel = client.channels.get(channelName);
    await channel.publish(eventName, data);
  }, [client]);

  const enterPresence = useCallback(async (channelName: string, data?: any) => {
    if (!client) throw new Error('Ably not connected');

    const channel = client.channels.get(channelName);
    await channel.presence.enter(data);
  }, [client]);

  const leavePresence = useCallback(async (channelName: string) => {
    if (!client) throw new Error('Ably not connected');

    const channel = client.channels.get(channelName);
    await channel.presence.leave();
  }, [client]);

  const getPresence = useCallback(async (channelName: string) => {
    if (!client) throw new Error('Ably not connected');

    const channel = client.channels.get(channelName);
    return await channel.presence.get();
  }, [client]);

  return (
    <AblyContext.Provider value={{
      client,
      isConnected,
      subscribe,
      publish,
      enterPresence,
      leavePresence,
      getPresence,
    }}>
      {children}
    </AblyContext.Provider>
  );
}

export function useAbly() {
  const context = useContext(AblyContext);
  if (!context) {
    throw new Error('useAbly must be used within an AblyProvider');
  }
  return context;
}

// Hook for call signaling
export function useCallSignaling(userId: string) {
  const { subscribe, publish, isConnected } = useAbly();
  const [incomingCall, setIncomingCall] = useState<{
    from: string;
<<<<<<< HEAD
    callerName?: string;
=======
    fromName?: string;
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703
    type: 'audio' | 'video';
    channelName: string;
  } | null>(null);
  const [hasBeenRejected, setHasBeenRejected] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    from: string;
    fromName?: string;
    type: 'audio' | 'video';
    channelName: string;
  } | null>(null);

  // Pick up call from URL params if present (e.g. from background notification)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const callChannel = params.get('call_channel');
    const callType = params.get('call_type') as 'audio' | 'video' | null;
    if (callChannel && callType) {
      console.log('[Signal] 🔗 Found active call in URL:', callChannel);
      setActiveCall({
        from: 'System',
        fromName: 'Remote',
        type: callType,
        channelName: callChannel
      });

      // Clean up URL to prevent re-triggering on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('call_channel');
      url.searchParams.delete('call_type');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const [callEndedSignal, setCallEndedSignal] = useState<{
    from: string;
    reason: 'ended' | 'rejected' | 'cancelled';
  } | null>(null);

  useEffect(() => {
    if (!isConnected || !userId) return;

    const normalizedUserId = userId.toLowerCase();
    const unsubscribe = subscribe(`user:${normalizedUserId}`, (message) => {
      console.log('[Signal] Received:', message.name, message.data);

      if (message.name === 'call:incoming') {
        setHasBeenRejected(false);
        setIsAccepted(false);
        setIncomingCall({
          from: message.data.from,
<<<<<<< HEAD
          callerName: message.data.callerName,
=======
          fromName: message.data.fromName,
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703
          type: message.data.type,
          channelName: message.data.channelName,
        });
      }

<<<<<<< HEAD
      if (message.name === 'call:cancelled' || message.name === 'call:rejected' || message.name === 'call:ended') {
        const reason = message.name.split(':')[1] as 'ended' | 'rejected' | 'cancelled';
        setCallEndedSignal({ from: message.data.from, reason });
=======
      if (message.name === 'call:cancelled') {
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703
        setIncomingCall(null);
        setActiveCall(null);
      }

      if (message.name === 'call:rejected') {
        setIncomingCall(null);
        setHasBeenRejected(true);
        setActiveCall(null);
      }

      if (message.name === 'call:accepted') {
        console.log('[Signal] Peer accepted call!');
        setIsAccepted(true);
      }
    });

    return unsubscribe;
  }, [subscribe, isConnected, userId]);

<<<<<<< HEAD
  const initiateCall = useCallback(async (targetUserId: string, type: 'audio' | 'video', callerName?: string) => {
=======
  const initiateCall = useCallback(async (targetUserId: string, type: 'audio' | 'video', fromName?: string) => {
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703
    const channelName = `call:${userId}-${targetUserId}-${Date.now()}`;
    setHasBeenRejected(false);
    setIsAccepted(false);

    console.log('[Signal] Initiating call:', {
      from: userId,
      callerName,
      to: targetUserId,
      targetChannel: `user:${targetUserId}`,
      type,
      channelName
    });

    const normalizedTargetId = targetUserId.toLowerCase();
    await publish(`user:${normalizedTargetId}`, 'call:incoming', {
      from: userId,
<<<<<<< HEAD
      callerName,
=======
      fromName: fromName,
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703
      type,
      channelName,
    });

    console.log('[Signal] Call published successfully');

    // Set as active call for caller too if we want unified management
    setActiveCall({
      from: userId,
      fromName: fromName,
      type,
      channelName
    });

    return channelName;
  }, [publish, userId]);

  const cancelCall = useCallback(async (targetUserId: string) => {
    const normalizedTargetId = targetUserId.toLowerCase();
    await publish(`user:${normalizedTargetId}`, 'call:cancelled', { from: userId });
    setActiveCall(null);
  }, [publish, userId]);

  const rejectCall = useCallback(async () => {
    if (incomingCall) {
      const normalizedFromId = incomingCall.from.toLowerCase();
      await publish(`user:${normalizedFromId}`, 'call:rejected', { from: userId });
      setIncomingCall(null);
      setActiveCall(null);
    }
  }, [publish, userId, incomingCall]);

  const acceptCall = useCallback(async () => {
    if (incomingCall) {
      const call = incomingCall;
      const normalizedFromId = call.from.toLowerCase();

      // Notify caller that we accepted
      await publish(`user:${normalizedFromId}`, 'call:accepted', { from: userId });

      setIsAccepted(true); // CRITICAL: Stop the safety timer
      setActiveCall(call);
      setIncomingCall(null);
      return call;
    }
    return null;
  }, [publish, userId, incomingCall]);

  const endActiveCall = useCallback(() => {
    console.log('[Signal] ⏹️ Terminating active call state');
    setActiveCall(null);
    setIsAccepted(false);
    if (callSafetyTimerRef.current) {
      console.log('[Signal] 🛡️ Clearing safety timer during termination');
      clearTimeout(callSafetyTimerRef.current);
      callSafetyTimerRef.current = null;
    }
  }, []);

  const callSafetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeCall && !isAccepted) {
      // Safety Timer: If call isn't accepted in 45s, auto-cancel
      if (!callSafetyTimerRef.current) {
        const isInitiator = activeCall.from === userId;
        console.log(`[Signal] 🛡️ STARTING 45s safety timer. Role: ${isInitiator ? 'Caller' : 'Receiver'}`);

        callSafetyTimerRef.current = setTimeout(() => {
          console.log('[Signal] ⏳ Session expired at 45s marker.');
          if (isInitiator) {
            console.log('[Signal] 📡 Caller auto-cancelling due to timeout');
            cancelCall(activeCall.channelName.split('-')[1]);
          } else {
            console.log('[Signal] 📡 Receiver auto-hanging up due to safety timeout');
          }
          endActiveCall();
        }, 45000);
      }
    } else {
      if (callSafetyTimerRef.current) {
        console.log('[Signal] ✅ Safety timer DISARMED (Active call accepted or cleared)');
        clearTimeout(callSafetyTimerRef.current);
        callSafetyTimerRef.current = null;
      }
    }
    return () => {
      if (callSafetyTimerRef.current) {
        clearTimeout(callSafetyTimerRef.current);
        callSafetyTimerRef.current = null;
      }
    };
  }, [activeCall, isAccepted, userId, cancelCall, endActiveCall]);

  return {
    isConnected,
    incomingCall,
    activeCall,
    isAccepted,
    hasBeenRejected,
    setHasBeenRejected,
    initiateCall,
    cancelCall,
    acceptCall,
<<<<<<< HEAD
    endCall: async (targetUserId: string) => {
      const normalizedTargetId = targetUserId.toLowerCase();
      await publish(`user:${normalizedTargetId}`, 'call:ended', { from: userId });
    },
    callEndedSignal: callEndedSignal,
    resetCallSignal: () => setCallEndedSignal(null),
=======
    endActiveCall,
  };
}

// Hook for broadcast chat
// Hook for broadcast chat with Polling Fallback
export function useBroadcastChat(channelName: string, username: string) {
  const { subscribe, publish, isConnected } = useAbly();
  const [messages, setMessages] = useState<any[]>([]);
  const [useFallback, setUseFallback] = useState(false);

  // Centralized Message Merger
  const addMessage = useCallback((newMsg: any) => {
    setMessages(prev => {
      if (prev.some(m => m.id === newMsg.id)) return prev;
      return [...prev, {
        id: newMsg.id || Math.random().toString(36).slice(2),
        from: newMsg.from,
        text: newMsg.text,
        isTip: newMsg.isTip,
        tipAmount: newMsg.tipAmount,
        timestamp: newMsg.timestamp || Date.now()
      }].sort((a, b) => a.timestamp - b.timestamp);
    });
  }, []);

  // 1. Ably Subscription (Primary)
  useEffect(() => {
    if (!channelName) return;

    if (!isConnected) {
      // If Ably disconnects (or never connects), switch to fallback after 5s
      const timer = setTimeout(() => setUseFallback(true), 5000);
      return () => clearTimeout(timer);
    }

    // If connected, turn off fallback (unless we want hybrid)
    setUseFallback(false);

    const unsubscribe = subscribe(`broadcast:${channelName}`, (message) => {
      if (message.name === 'message') {
        addMessage(message.data);
      }
    });

    return unsubscribe;
  }, [subscribe, isConnected, channelName, addMessage]);

  // 2. Polling Fallback (Secondary - Active if Ably fails)
  useEffect(() => {
    if (!useFallback || !channelName) return;

    console.log('[Chat] ⚠️ Using Polling Fallback');
    const poll = async () => {
      try {
        const res = await fetch(`/api/broadcast/chat?channelName=${encodeURIComponent(channelName)}&since=${Date.now() - 10000}`);
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach(addMessage);
        }
      } catch (e) {
        console.error('[Chat] Polling failed', e);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [useFallback, channelName, addMessage]);

  const sendMessage = useCallback(async (text: string, isTip?: boolean, tipAmount?: number) => {
    const messageId = Math.random().toString(36).slice(2);
    const msg = {
      id: messageId,
      from: username,
      text,
      isTip,
      tipAmount,
      timestamp: Date.now()
    };

    // Optimistic Update
    addMessage(msg);

    try {
      if (isConnected && !useFallback) {
        await publish(`broadcast:${channelName}`, 'message', msg);
      } else {
        throw new Error("Ably down");
      }
    } catch (e) {
      console.log('[Chat] Ably failed, relying on API fallback');
      // API persist handled by component, which is good.
    }

    return msg;
  }, [publish, channelName, username, isConnected, useFallback, addMessage]);

  return {
    messages,
    setMessages,
    sendMessage,
    isConnected: isConnected || useFallback // Report "connected" if fallback works
>>>>>>> 08ca4b6a09d3c4cbc0408e49b5f0049cd694b703
  };
}
