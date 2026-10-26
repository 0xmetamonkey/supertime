'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import MatchingLobby from '@/app/components/Roulette/MatchingLobby';

const RouletteStage = dynamic(() => import('@/app/components/Roulette/RouletteStage'), {
  ssr: false,
});

export default function HourglassClient() {
  const [activeMode, setActiveMode] = useState<'none' | 'peer_match'>('none');
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  if (activeMode === 'peer_match') {
    return (
      <RouletteStage
        initialLocalStream={activeStream}
        onClose={() => {
          setActiveStream(null);
          setActiveMode('none');
        }}
      />
    );
  }

  return (
    <MatchingLobby
      title="Supertalks"
      subtitle="Spontaneous 1-on-1 video conversations. Real people, 30-second rounds, peer-to-peer WebRTC."
      onStartMatching={(stream) => {
        setActiveStream(stream);
        setActiveMode('peer_match');
      }}
    />
  );
}
