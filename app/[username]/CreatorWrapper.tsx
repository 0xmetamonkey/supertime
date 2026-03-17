'use client';

import { useEffect, useState } from 'react';
import { AblyProvider, useCallSignaling } from '@/app/lib/ably';
import CreatorClient from './CreatorClient';
import { IncomingCallRing } from '@/app/components/IncomingCallRing';
import { PushNotificationManager } from '@/app/components/PushNotificationManager';

interface CreatorWrapperProps {
  username: string;
  user: any;
  isOwner: boolean;
  ownerEmail: string;
  isVerified?: boolean;
  socials?: any;
  videoRate?: number;
  audioRate?: number;
  profileImage?: string;
  isLive?: boolean;
  isAcceptingCalls?: boolean;
  templates?: any[];
  availability?: any;
  artifacts?: any[];
  faqs?: any[];
  roomType?: 'audio' | 'video';
  isRoomFree?: boolean;
  studioMode?: 'solitude' | 'theatre' | 'private';
}

function CreatorWithSignaling(props: CreatorWrapperProps & { clientId: string }) {
  const signaling = useCallSignaling(props.clientId);

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
      <PushNotificationManager userId={props.clientId} />
      <CreatorClient
        {...props}
        // Inject Ably signaling for call initiation
        _ablySignaling={signaling}
      />
    </>
  );
}

export default function CreatorWrapper(props: CreatorWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate a client ID for the visitor
  // CRITICAL: If owner, we MUST use the username slug so callers (who use props.username) can find us.
  const clientId = props.isOwner
    ? props.username.toLowerCase()
    : (props.user?.id || props.user?.email || `visitor-${Math.random().toString(36).slice(2, 8)}`).toLowerCase();

  if (!mounted) {
    // SSR fallback - Wrap with AblyProvider (even if client isn't fully ready yet) to avoid useContext errors
    return (
      <AblyProvider clientId={clientId}>
        <CreatorClient {...props} />
      </AblyProvider>
    );
  }

  return (
    <AblyProvider clientId={clientId}>
      <CreatorWithSignaling {...props} clientId={clientId} />
    </AblyProvider>
  );
}
