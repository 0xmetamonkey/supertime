'use client';

import { useEffect, useState } from 'react';
import { AblyProvider, useCallSignaling } from '@/app/lib/ably';

interface CallSignalWrapperProps {
  userId: string;
  children: (props: {
    isConnected: boolean;
    incomingCall: { from: string; type: 'audio' | 'video'; channelName: string } | null;
    initiateCall: (targetUserId: string, type: 'audio' | 'video') => Promise<string>;
    acceptCall: () => { from: string; type: 'audio' | 'video'; channelName: string } | null;
    rejectCall: () => Promise<void>;
    cancelCall: (targetUserId: string) => Promise<void>;
  }) => React.ReactNode;
}

function CallSignalContent({ userId, children }: CallSignalWrapperProps) {
  const signaling = useCallSignaling(userId);
  return <>{children(signaling)}</>;
}

export function CallSignalWrapper({ userId, children }: CallSignalWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children({
      isConnected: false,
      incomingCall: null,
      initiateCall: async () => '',
      acceptCall: () => null,
      rejectCall: async () => { },
      cancelCall: async () => { },
    })}</>;
  }

  return (
    <AblyProvider clientId={userId}>
      <CallSignalContent userId={userId}>{children}</CallSignalContent>
    </AblyProvider>
  );
}
