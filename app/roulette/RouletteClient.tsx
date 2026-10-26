'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import MatchingLobby from '@/app/components/Roulette/MatchingLobby';

const RouletteStage = dynamic(() => import('@/app/components/Roulette/RouletteStage'), {
  ssr: false,
});

export default function RouletteClient() {
  const [hasStarted, setHasStarted] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  if (hasStarted) {
    return (
      <RouletteStage
        initialLocalStream={activeStream}
        onClose={() => {
          setActiveStream(null);
          setHasStarted(false);
        }}
      />
    );
  }

  return (
    <MatchingLobby
      title="Video Roulette"
      subtitle="Spontaneous, 1-on-1 random video chat. 30-second timers with mutual +Time."
      onStartMatching={(stream) => {
        setActiveStream(stream);
        setHasStarted(true);
      }}
    />
  );
}
