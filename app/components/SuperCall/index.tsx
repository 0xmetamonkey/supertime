'use client';

import React from 'react';
import CallStage from './CallStage';
import ErrorBoundary from '../ErrorBoundary';

interface SuperCallProps {
  channelName: string;
  uid: string | number;
  type?: 'audio' | 'video' | string | null;
  onDisconnect: () => void;
  onSaveArtifact?: (url: string) => void;
  onPeerJoined?: () => void;
  onPeerLeft?: () => void;
  creatorEmail?: string;
  isCreator?: boolean;
}

export default function SuperCall({
  channelName, uid, type, onDisconnect, onSaveArtifact, onPeerJoined, onPeerLeft, creatorEmail, isCreator
}: SuperCallProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden">
      <ErrorBoundary>
        <CallStage
          channelName={channelName}
          uid={uid}
          type={type === 'video' ? 'video' : 'audio'}
          creatorEmail={creatorEmail}
          isCreator={isCreator}
          onDisconnect={onDisconnect}
          onSaveArtifact={onSaveArtifact}
          onPeerJoined={onPeerJoined}
          onPeerLeft={onPeerLeft}
        />
      </ErrorBoundary>
    </div>
  );
}
