'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, X, ArrowRight, Sparkles } from 'lucide-react';

interface TalkTimeInvite {
  from: string;
  fromEmail: string;
  roomId: string;
  roomTitle: string;
  joinUrl: string;
}

interface IncomingTalkTimeInviteProps {
  invite: TalkTimeInvite | null;
  onDismiss: () => void;
}

export function IncomingTalkTimeInvite({ invite, onDismiss }: IncomingTalkTimeInviteProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (invite) {
      // Soft chime — reuse the existing call sound at lower volume
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('/Aura_Call_2026-06-04T070202.wav');
          audioRef.current.volume = 0.4;
          audioRef.current.loop = false;
        }
        audioRef.current.play().catch(() => {});
      } catch {}
    } else {
      audioRef.current?.pause();
    }
  }, [invite]);

  // Auto-dismiss after 30s
  useEffect(() => {
    if (!invite) return;
    const t = setTimeout(onDismiss, 30000);
    return () => clearTimeout(t);
  }, [invite, onDismiss]);

  return (
    <AnimatePresence>
      {invite && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.92 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4"
        >
          <div className="relative bg-background/95 backdrop-blur-3xl border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden">

            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-1/2 -right-1/4 w-3/4 h-3/4 bg-violet-500/10 blur-[80px] rounded-full" />
              <div className="absolute -bottom-1/2 -left-1/4 w-3/4 h-3/4 bg-rose-500/8 blur-[80px] rounded-full" />
            </div>

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="relative z-10 p-6 flex items-start gap-4">
              {/* Icon */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <Radio className="w-7 h-7 text-violet-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
                    TalkTime Invite
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground leading-tight">
                  @{invite.from} wants to talk
                </p>
                <p className="text-xs text-muted mt-0.5 truncate">
                  "{invite.roomTitle}"
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => {
                      window.location.href = invite.joinUrl;
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-bold text-xs rounded-xl shadow-md hover:opacity-90 active:scale-[0.97] transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Join Now
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onDismiss}
                    className="px-4 py-2.5 bg-surface border border-border text-muted text-xs font-medium rounded-xl hover:bg-background hover:text-foreground transition-all"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
