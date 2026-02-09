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

  // Log incoming calls and signaling status
  useEffect(() => {
    const channelName = `user:${(username || 'anonymous').toLowerCase()}`;
    console.log('[Studio] Signaling Status Update:', {
      userId: username,
      clientId: (username || session?.user?.email || 'anonymous').toLowerCase(),
      connected: signaling.isConnected,
      subscribingTo: channelName,
      timestamp: new Date().toLocaleTimeString()
    });

    if (signaling.incomingCall) {
      console.log('[Studio] !!! INCOMING CALL DETECTED !!!', {
        from: signaling.incomingCall.from,
        fromName: signaling.incomingCall.fromName,
        type: signaling.incomingCall.type,
        channel: signaling.incomingCall.channelName
      });
    }
  }, [signaling.incomingCall, signaling.isConnected, username, session?.user?.email]);

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
  // CRITICAL: Ensure clientId is strictly lowercased and consistent with what caller publishes to
  const rawId = props.username || props.session?.user?.email || (isSimulated ? 'test-creator' : 'anonymous');
  const clientId = rawId.toLowerCase();

  return (
    <AblyProvider clientId={clientId}>
      <StudioWithSignaling {...props} />
    </AblyProvider>
  );
}
