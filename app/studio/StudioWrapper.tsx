'use client';

import { useEffect, useState } from 'react';
import { AblyProvider, useCallSignaling, useAbly } from '@/app/lib/ably';
import StudioClient from './StudioClient';
import { IncomingCallRing } from '@/app/components/IncomingCallRing';
import { IncomingTalkTimeInvite } from '@/app/components/IncomingTalkTimeInvite';

interface StudioWrapperProps {
  username: string | null;
  session: { user: { id: string; email: string } } | null;
  initialSettings: Record<string, unknown>;
}

function StudioWithSignaling({ username, session, initialSettings }: StudioWrapperProps) {
  const signaling = useCallSignaling(username || 'anonymous');
  const { subscribe, isConnected } = useAbly();
  const [talkTimeInvite, setTalkTimeInvite] = useState<Record<string, unknown> | null>(null);

  // Listen for incoming TalkTime invites on user's Ably channel
  useEffect(() => {
    if (!isConnected || !username) return;
    const email = session?.user?.email?.toLowerCase();
    if (!email) return;

    const unsubscribe = subscribe(`user:${email}`, (message: { name: string; data: Record<string, unknown> }) => {
      if (message.name === 'talktime:invite') {
        setTalkTimeInvite(message.data);
      }
    });
    return unsubscribe;
  }, [isConnected, username, session?.user?.email, subscribe]);

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
    <>
      <IncomingCallRing
        incomingCall={signaling.incomingCall}
        onAccept={async () => {
          signaling.acceptCall();
        }}
        onReject={async () => {
          await signaling.rejectCall();
        }}
      />
      <IncomingTalkTimeInvite
        invite={talkTimeInvite}
        onDismiss={() => setTalkTimeInvite(null)}
      />
      <StudioClient
        username={username}
        session={session}
        initialSettings={{
          ...initialSettings,
          // Inject Ably signaling functions
          _ablySignaling: signaling,
        }}
      />
    </>
  );
}

export default function StudioWrapper(props: StudioWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isSimulated = typeof window !== 'undefined' && window.location.search.includes('sim=true');
  // CRITICAL: Ensure clientId is strictly lowercased and consistent with what caller publishes to
  const rawId = props.username || props.session?.user?.email || (isSimulated ? 'test-creator' : 'anonymous');
  const clientId = rawId.toLowerCase();

  if (!mounted) {
    return (
      <AblyProvider clientId={clientId}>
        <StudioClient {...props} />
      </AblyProvider>
    );
  }

  return (
    <AblyProvider clientId={clientId}>
      <StudioWithSignaling {...props} />
    </AblyProvider>
  );
}
