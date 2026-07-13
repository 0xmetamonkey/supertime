'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AblyProvider } from '@/app/lib/ably';

// Dynamically import to avoid SSR issues with Agora
const BroadcastHost = dynamic(() => import('@/app/components/Broadcast/BroadcastHost'), { ssr: false });
const BroadcastViewer = dynamic(() => import('@/app/components/Broadcast/BroadcastViewer'), { ssr: false });
const CallStage = dynamic(() => import('@/app/components/SuperCall/CallStage'), { ssr: false });

export default function CallRoomClient({ roomId }: { roomId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHost = searchParams.get('host') === 'true';
  const isViewer = searchParams.get('viewer') === 'true';
  const username = searchParams.get('u') || 'host';

  const [randomId] = useState(() => Math.floor(Math.random() * 10000));

  const handleDisconnect = () => {
    router.push('/dashboard');
    router.refresh();
  };

  // Broadcast mode: host or viewer — needs AblyProvider for chat
  if (isHost) {
    return (
      <AblyProvider clientId={`broadcast-host-${username}`}>
        <BroadcastHost
          channelName={roomId}
          uid={`host_${randomId}`}
          username={username}
          onEnd={handleDisconnect}
        />
      </AblyProvider>
    );
  }

  if (isViewer) {
    return (
      <AblyProvider clientId={`broadcast-viewer-${randomId}`}>
        <BroadcastViewer
          channelName={roomId}
          uid={`viewer_${randomId}`}
          creatorUsername={username}
          onLeave={handleDisconnect}
          onRequestCall={() => {}}
          userBalance={0}
          userDisplayName={'Fan'}
        />
      </AblyProvider>
    );
  }

  // Default: 1:1 call mode
  return (
    <CallStage
      channelName={roomId}
      uid={'guest_' + randomId}
      type="video"
      onDisconnect={handleDisconnect}
    />
  );
}
