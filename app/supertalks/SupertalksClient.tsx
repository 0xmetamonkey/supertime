'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const RouletteStage = dynamic(() => import('@/app/components/Roulette/RouletteStage'), {
  ssr: false,
});

function SupertalksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode') === 'audio' ? 'audio' : 'video';
  const { user } = useUser();
  const [userMeta, setUserMeta] = useState<any>(null);

  useEffect(() => {
    fetch('/api/wallet')
      .then((res) => res.json())
      .then((data) => {
        if (user) {
          setUserMeta({
            isCreator: data.isCreator ?? false,
            username: user.username || user.firstName || 'user',
            creatorEmail: user.primaryEmailAddress?.emailAddress || '',
            videoRate: data.videoRate || 100,
            displayName: user.fullName || user.firstName || 'User',
          });
        }
      })
      .catch(() => {
        if (user) {
          setUserMeta({
            isCreator: false,
            username: user.username || user.firstName || 'user',
            creatorEmail: user.primaryEmailAddress?.emailAddress || '',
            videoRate: 100,
            displayName: user.fullName || user.firstName || 'User',
          });
        }
      });
  }, [user]);

  return (
    <RouletteStage
      initialMode={modeParam}
      initialUserMeta={userMeta}
      onClose={() => router.push('/')}
    />
  );
}

export default function SupertalksClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white text-sm">Loading Supertalks...</div>}>
      <SupertalksContent />
    </Suspense>
  );
}
