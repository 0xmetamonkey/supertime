'use client';

import { useEffect } from 'react';
import { AblyProvider, useCallSignaling } from '@/app/lib/ably';
import StudioClient from './StudioClient';

interface StudioWrapperProps {
  username: string | null;
  session: any;
  initialSettings: any;
}

function StudioWithSignaling({ username, session, initialSettings }: StudioWrapperProps) {
  const signaling = useCallSignaling(username || 'anonymous');

  // Log incoming calls
  useEffect(() => {
    if (signaling.incomingCall) {
      console.log('[Studio] Incoming call via Ably:', signaling.incomingCall);
    }
  }, [signaling.incomingCall]);

  return (
    <StudioClient
      username={username}
      session={session}
      initialSettings={{
        ...initialSettings,
        // Inject Ably signaling functions
        _ablySignaling: signaling,
      }}
    />
  );
}

export default function StudioWrapper(props: StudioWrapperProps) {
  const isSimulated = typeof window !== 'undefined' && window.location.search.includes('sim=true');
  const clientId = props.username || props.session?.user?.email || (isSimulated ? 'test-creator' : 'anonymous');

  return (
    <AblyProvider clientId={clientId}>
      <StudioWithSignaling {...props} />
    </AblyProvider>
  );
}
