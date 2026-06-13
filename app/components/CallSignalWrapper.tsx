'use client';

import { useEffect, useState } from 'react';
import { AblyProvider, useCallSignaling } from '@/app/lib/ably';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface CallSignalWrapperProps {
  userId: string;
  children: (signaling: any) => React.ReactNode;
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
