'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCallEngine } from '@/app/hooks/useCallEngine';
import { Sparkles, Mic, MicOff, Video, VideoOff, PhoneOff, RotateCcw } from 'lucide-react';

interface CallStageV2Props {
  channelName: string;
  uid: string;
  type: 'audio' | 'video';
  onDisconnect: () => void;
}

export default function CallStageV2({ channelName, uid, type, onDisconnect }: CallStageV2Props) {
  const {
    status,
    error,
    localTracks,
    remoteUsers,
    isAudioEnabled,
    isVideoEnabled,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    retry,
  } = useCallEngine({ uid, onCallEnded: onDisconnect });

  const isVideo = type === 'video';

  // Start call on mount
  useEffect(() => {
    startCall(channelName, type);
  }, [channelName, type, startCall]);

  // Handle disconnect
  const handleDisconnect = () => {
    endCall();
  };

  // Render based on status
  if (status === 'error') {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 text-4xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-red-500">
          Connection Failed
        </h2>
        <p className="text-zinc-400 text-center max-w-sm mb-8">
          {error || 'Unable to connect to the call. Please try again.'}
        </p>
        <div className="flex gap-4">
          <button
            onClick={retry}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-neo-yellow transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
          <button
            onClick={onDisconnect}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white font-bold rounded-full hover:bg-zinc-700 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  if (status === 'connecting' || status === 'idle') {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-neo-yellow border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold uppercase tracking-widest animate-pulse">
          Connecting...
        </h2>
        <p className="text-zinc-500 text-sm mt-2">{channelName}</p>
      </div>
    );
  }

  const mainRemoteUser = remoteUsers[0];

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Status Header */}
      <div className="absolute top-0 inset-x-0 z-30 p-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className={`px-4 py-1.5 border-2 border-black font-black uppercase text-xs shadow-neo ${isVideo ? 'bg-neo-pink' : 'bg-neo-blue'}`}>
            {channelName.startsWith('room-') ? 'Studio Room' : 'Private Call'}
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {status === 'connected' ? 'Live' : 'Reconnecting...'}
            </span>
          </div>
        </div>
        <div className="bg-neo-yellow border-2 border-black px-4 py-2 shadow-neo text-black flex items-center gap-3 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest leading-none opacity-40">Participants</span>
            <span className="text-xl font-black tabular-nums leading-none">{(remoteUsers.length + 1).toString().padStart(2, '0')}</span>
          </div>
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      {/* Main Video Area */}
      <div className="absolute inset-0 z-0 bg-zinc-950 flex items-center justify-center p-6 pb-32">
        {remoteUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center">
            {isVideo && localTracks?.[1] ? (
              <div className="w-full max-w-2xl aspect-video bg-zinc-900 border-2 border-white/10 rounded-2xl overflow-hidden relative">
                <VideoPlayer track={localTracks[1]} />
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 rounded-full text-xs font-bold">
                  Your Preview
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">
                Waiting for others to join...
              </div>
            )}
          </div>
        ) : (
          <div className={`w-full h-full grid gap-4 ${remoteUsers.length === 1 ? 'grid-cols-1' : remoteUsers.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {remoteUsers.map((user) => (
              <div key={user.uid} className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/10">
                {user.videoTrack ? (
                  <VideoPlayer track={user.videoTrack} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-3xl">
                      👤
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-full text-[10px] font-bold">
                  ID: {user.uid}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Local Video PiP */}
      {isVideo && localTracks?.[1] && remoteUsers.length > 0 && (
        <div className="absolute bottom-28 right-4 w-28 h-40 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10">
          <VideoPlayer track={localTracks[1]} />
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-8 inset-x-0 flex justify-center z-20">
        <div className="flex bg-zinc-900/90 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl gap-2">
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isAudioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {isVideo && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={handleDisconnect}
            className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Video player component
function VideoPlayer({ track }: { track: any }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!track || !ref.current) return;
    track.play(ref.current);
    return () => {
      track.stop();
    };
  }, [track]);

  return <div ref={ref} className="w-full h-full" style={{ objectFit: 'cover' }} />;
}
