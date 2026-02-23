'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, X } from 'lucide-react';

interface IncomingCallRingProps {
  incomingCall: {
    from: string;
    fromName?: string;
    type: 'audio' | 'video';
    channelName: string;
  } | null;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallRing({ incomingCall, onAccept, onReject }: IncomingCallRingProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (incomingCall) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
        audioRef.current.loop = true;
      }

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error("Auto-play failed, waiting for user interaction:", error);
        });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl"
      >
        <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="flex flex-col items-center pt-20 pb-12 px-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-8 ring-4 ring-white/10 ring-offset-4 ring-offset-zinc-900">
                <span className="text-3xl font-bold text-white">
                  {(incomingCall.fromName || incomingCall.from).charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Ringing animation */}
              <div className="absolute inset-0 -m-2 rounded-full border-2 border-blue-500/50 animate-ping" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {incomingCall.fromName || 'Someone Special'}
            </h2>
            <p className="text-zinc-400 font-medium">
              Incoming {incomingCall.type === 'video' ? 'Video' : 'Audio'} Call...
            </p>
          </div>

          <div className="flex items-center justify-center gap-12 pb-20 px-8">
            <button
              onClick={onReject}
              className="group flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                <PhoneOff className="w-8 h-8 text-white fill-current" />
              </div>
              <span className="text-xs font-semibold text-zinc-500 group-hover:text-red-400">Decline</span>
            </button>

            <button
              onClick={onAccept}
              className="group flex flex-col items-center gap-2"
            >
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                {incomingCall.type === 'video' ? (
                  <Video className="w-10 h-10 text-white fill-current" />
                ) : (
                  <Phone className="w-10 h-10 text-white fill-current" />
                )}
              </div>
              <span className="text-xs font-semibold text-white group-hover:text-green-400">Accept</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
