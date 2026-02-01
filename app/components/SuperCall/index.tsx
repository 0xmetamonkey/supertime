'use client';

import React from 'react';
import CallStage from './CallStage';
import ErrorBoundary from '../ErrorBoundary';

interface SuperCallProps {
  channelName: string;
  type?: 'audio' | 'video' | string | null;
  onDisconnect: () => void;
  onSaveArtifact?: (url: string) => void;
}

export default function SuperCall({ channelName, type, onDisconnect, onSaveArtifact }: SuperCallProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden">
      <ErrorBoundary>
        <CallStage
          channelName={channelName}
          type={type === 'video' ? 'video' : 'audio'}
          onDisconnect={onDisconnect}
          onSaveArtifact={onSaveArtifact}
        />
      </ErrorBoundary>
    </div>
  );
}
