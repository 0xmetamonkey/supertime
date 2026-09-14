'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  MoreHorizontal, 
  UserPlus, 
  VolumeX, 
  ChevronLeft, 
  Sparkles,
  Plus
} from 'lucide-react';
import { RoomConfig } from './RoomPreflightModal';

interface ActiveRoomViewProps {
  config: RoomConfig;
  creatorName: string;
  onEndRoom: () => void;
  onOpenMenu: () => void;
  onOpenWaitlist?: () => void;
}

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'speaker' | 'audience';
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  avatarLetter: string;
}

export default function ActiveRoomView({
  config,
  creatorName,
  onEndRoom,
  onOpenMenu,
  onOpenWaitlist,
}: ActiveRoomViewProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Simulated participants matching the exact mockups
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'You', role: 'host', isSpeaking: true, isMuted: false, isVideoOn: true, avatarLetter: 'Y' },
    { id: '2', name: 'Aarav', role: 'speaker', isSpeaking: true, isMuted: false, isVideoOn: false, avatarLetter: 'A' },
    { id: '3', name: 'Maya', role: 'speaker', isSpeaking: false, isMuted: false, isVideoOn: false, avatarLetter: 'M' },
    { id: '4', name: 'Kabir', role: 'speaker', isSpeaking: false, isMuted: true, isVideoOn: false, avatarLetter: 'K' },
    { id: '5', name: 'Tara', role: 'speaker', isSpeaking: false, isMuted: false, isVideoOn: false, avatarLetter: 'T' },
    { id: '6', name: 'Rohan', role: 'speaker', isSpeaking: true, isMuted: false, isVideoOn: false, avatarLetter: 'R' },
  ]);

  // Stage audience count
  const [audienceCount, setAudienceCount] = useState(42);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white max-w-lg mx-auto select-none overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          onClick={onEndRoom}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 className="text-sm font-semibold tracking-tight">
            {config.mode === '1v1' && '1 : 1'}
            {config.mode === 'circle' && 'Many : Many'}
            {config.mode === 'stage' && 'Stage Room'}
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            {config.mode === '1v1' && <span>{formatTimer(elapsedSeconds)}</span>}
            {config.mode === 'circle' && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white inline-block" />
                {participants.length} / {config.capacity}
              </span>
            )}
            {config.mode === 'stage' && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
                {audienceCount}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onOpenMenu}
          className="p-2 -mr-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 transition-colors"
          aria-label="Options"
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Main Room Stage Area */}
      <div className="flex-1 flex flex-col px-4 py-2 overflow-y-auto">
        {/* ──────── 1:1 Layout ──────── */}
        {config.mode === '1v1' && (
          <div className="flex-1 flex flex-col relative justify-between pb-24">
            {/* Host PiP Card */}
            <div className="absolute top-2 right-2 w-28 h-36 bg-neutral-200 dark:bg-neutral-800 rounded-3xl border border-neutral-300 dark:border-neutral-700 shadow-lg flex flex-col items-center justify-center z-10 overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-neutral-400 dark:bg-neutral-600 flex items-center justify-center mb-2">
                <div className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-neutral-300" />
              </div>
              <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">You</span>
            </div>

            {/* Guest Main View */}
            <div className="flex-1 flex flex-col items-center justify-center my-auto">
              <div className="w-32 h-32 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-6 shadow-inner">
                <div className="w-16 h-16 rounded-full bg-neutral-900 dark:bg-white" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Priya</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">1:1 Session • {config.duration} min</p>
            </div>
          </div>
        )}

        {/* ──────── Circle Many:Many Layout ──────── */}
        {config.mode === 'circle' && (
          <div className="flex-1 grid grid-cols-2 gap-3 pb-24 auto-rows-fr">
            {participants.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-3xl border p-4 flex flex-col justify-between transition-all ${
                  p.name === 'You'
                    ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-900'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                }`}
              >
                {/* Avatar Icon */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-base font-semibold text-neutral-800 dark:text-neutral-200 shadow-xs">
                    {p.name === 'You' ? (
                      <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-white" />
                    ) : (
                      p.avatarLetter
                    )}
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="flex items-center justify-between mt-2 pt-2">
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{p.name}</span>
                  {p.isSpeaking && (
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-neutral-900 dark:bg-white rounded-full animate-bounce" />
                      <span className="w-1 h-4 bg-neutral-900 dark:bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1 h-2 bg-neutral-900 dark:bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  )}
                  {p.isMuted && <MicOff className="w-3.5 h-3.5 text-neutral-400" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ──────── 1:Many Stage Layout ──────── */}
        {config.mode === 'stage' && (
          <div className="flex-1 flex flex-col space-y-4 pb-24">
            {/* Host Banner */}
            <div className="relative w-full h-44 rounded-3xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center mb-2">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900" />
              </div>
              <div className="absolute bottom-3 left-3 bg-neutral-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 dark:bg-white dark:text-neutral-950">
                <Mic className="w-3 h-3" />
                <span>You</span>
              </div>
            </div>

            {/* On Stage Section */}
            <div>
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                On Stage (2)
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="h-24 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-1.5">
                    <div className="w-4 h-4 rounded-full bg-neutral-800 dark:bg-neutral-300" />
                  </div>
                  <span className="text-[11px] font-medium">Maya</span>
                </div>

                <div className="h-24 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-1.5">
                    <div className="w-4 h-4 rounded-full bg-neutral-800 dark:bg-neutral-300" />
                  </div>
                  <span className="text-[11px] font-medium">Kabir</span>
                </div>

                <button
                  onClick={onOpenMenu}
                  className="h-24 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-neutral-600 dark:text-neutral-400 hover:border-neutral-500 transition-colors"
                >
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-[11px] font-medium">Invite</span>
                </button>
              </div>
            </div>

            {/* Audience Section */}
            <div>
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                Audience ({audienceCount})
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0"
                  >
                    <div className="w-4 h-4 rounded-full bg-neutral-700 dark:bg-neutral-300" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 shrink-0">
                  +{audienceCount - 6}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──────── Floating Bottom Control Bar ──────── */}
      <div className="absolute bottom-6 left-0 right-0 px-6 flex items-center justify-center z-20">
        <div className="flex items-center gap-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-6 py-3 rounded-full border border-neutral-200 dark:border-neutral-800 shadow-2xl">
          {/* Mute Control */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex flex-col items-center gap-1 focus:outline-none"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
            }`}>
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <span className="text-[10px] text-neutral-500 font-medium">
              {config.mode === 'circle' || config.mode === 'stage' ? 'Mute All' : 'Mute'}
            </span>
          </button>

          {/* Video or Action Control */}
          {config.mode === '1v1' && (
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className="flex flex-col items-center gap-1 focus:outline-none"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                !isVideoOn ? 'bg-red-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
              }`}>
                {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">Video</span>
            </button>
          )}

          {config.mode === 'circle' && (
            <button
              onClick={onOpenMenu}
              className="flex flex-col items-center gap-1 focus:outline-none"
            >
              <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">Add</span>
            </button>
          )}

          {config.mode === 'stage' && (
            <button
              onClick={onOpenMenu}
              className="flex flex-col items-center gap-1 focus:outline-none"
            >
              <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">Invite</span>
            </button>
          )}

          {/* End / Leave Room Button */}
          <button
            onClick={onEndRoom}
            className="flex flex-col items-center gap-1 focus:outline-none"
          >
            <div className="w-14 h-11 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg">
              <PhoneOff className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-neutral-500 font-medium">
              {config.mode === 'circle' ? 'Leave' : 'End'}
            </span>
          </button>

          {/* More Menu */}
          <button
            onClick={onOpenMenu}
            className="flex flex-col items-center gap-1 focus:outline-none"
          >
            <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-neutral-500 font-medium">More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
