'use client';

import { useEffect, useState } from 'react';
import { AblyProvider, useCallSignaling } from '@/app/lib/ably';
import CreatorClient from './CreatorClient';

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
  roomType?: 'audio' | 'video';
  isRoomFree?: boolean;
  studioMode?: 'solitude' | 'theatre' | 'private';
}

function CreatorWithSignaling(props: CreatorWrapperProps & { clientId: string }) {
  const signaling = useCallSignaling(props.clientId);

  return (
    <CreatorClient
      {...props}
      // Inject Ably signaling for call initiation
      _ablySignaling={signaling}
    />
  );
}

export default function CreatorWrapper(props: CreatorWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate a client ID for the visitor
  const clientId = props.user?.id || props.user?.email || `visitor-${Math.random().toString(36).slice(2, 8)}`;

  if (!mounted) {
    // SSR fallback - render without Ably
    return <CreatorClient {...props} />;
  }

  return (
    <AblyProvider clientId={clientId}>
      <CreatorWithSignaling {...props} clientId={clientId} />
    </AblyProvider>
  );
}
