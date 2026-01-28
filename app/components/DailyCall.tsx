'use client';

import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';

type DailyCallProps = {
  channelName: string;
  remoteName?: string;
  onEndCall?: () => void;
};

export default function DailyCall({ channelName, remoteName, onEndCall }: DailyCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || callFrameRef.current) return;

    const initDaily = async () => {
      try {
        // 1. Get Room URL from our API
        // We'll use the channelName to ensure both users land in the same Daily room
        const res = await fetch(`/api/daily?roomName=${channelName.toLowerCase()}`);
        const { url, error: apiError } = await res.json();

        if (apiError || !url) {
          throw new Error(apiError || 'Could not create Daily room');
        }

        // 2. Create the call frame
        const callFrame = DailyIframe.createFrame(containerRef.current!, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '12px',
          },
          showLeaveButton: true,
          theme: {
            colors: {
              accent: '#CEFF1A',
              accentText: '#000000',
              background: '#000000',
              baseText: '#FFFFFF',
            }
          }
        });

        callFrameRef.current = callFrame;

        // 3. Setup events
        callFrame.on('left-meeting', () => {
          if (onEndCall) onEndCall();
        });

        // 4. Join the room
        await callFrame.join({ url });

      } catch (err: any) {
        console.error('Daily Init Failed:', err);
        setError(err.message || 'Failed to start call');
      }
    };

    initDaily();

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [channelName, onEndCall]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4 text-center">
        <h2 className="text-xl font-bold text-red-500 mb-4">Connection Failed</h2>
        <p className="text-zinc-400 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[#CEFF1A] text-black font-bold uppercase rounded-full"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen bg-black flex flex-col">
      <div className="flex-1 relative" ref={containerRef} />
    </div>
  );
}
