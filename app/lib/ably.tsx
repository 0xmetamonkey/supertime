'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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
    if (!clientId) return;

    console.log('[Ably] Initializing client for:', clientId);

    const ablyClient = new Ably.Realtime({
      authUrl: `/api/ably/token?clientId=${encodeURIComponent(clientId)}`,
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
    type: 'audio' | 'video';
    channelName: string;
  } | null>(null);

  useEffect(() => {
    if (!isConnected || !userId) return;

    const normalizedUserId = userId.toLowerCase();
    const unsubscribe = subscribe(`user:${normalizedUserId}`, (message) => {
      console.log('[Signal] Received:', message.name, message.data);

      if (message.name === 'call:incoming') {
        setIncomingCall({
          from: message.data.from,
          type: message.data.type,
          channelName: message.data.channelName,
        });
      }

      if (message.name === 'call:cancelled' || message.name === 'call:rejected') {
        setIncomingCall(null);
      }
    });

    return unsubscribe;
  }, [subscribe, isConnected, userId]);

  const initiateCall = useCallback(async (targetUserId: string, type: 'audio' | 'video') => {
    const channelName = `call:${userId}-${targetUserId}-${Date.now()}`;

    console.log('[Signal] Initiating call:', {
      from: userId,
      to: targetUserId,
      targetChannel: `user:${targetUserId}`,
      type,
      channelName
    });

    const normalizedTargetId = targetUserId.toLowerCase();
    await publish(`user:${normalizedTargetId}`, 'call:incoming', {
      from: userId,
      type,
      channelName,
    });

    console.log('[Signal] Call published successfully');
    return channelName;
  }, [publish, userId]);

  const cancelCall = useCallback(async (targetUserId: string) => {
    await publish(`user:${targetUserId}`, 'call:cancelled', { from: userId });
  }, [publish, userId]);

  const rejectCall = useCallback(async () => {
    if (incomingCall) {
      await publish(`user:${incomingCall.from}`, 'call:rejected', { from: userId });
      setIncomingCall(null);
    }
  }, [publish, userId, incomingCall]);

  const acceptCall = useCallback(() => {
    const call = incomingCall;
    setIncomingCall(null);
    return call;
  }, [incomingCall]);

  return {
    isConnected,
    incomingCall,
    initiateCall,
    cancelCall,
    rejectCall,
    acceptCall,
  };
}
