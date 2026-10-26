'use client';

import React from 'react';
import { ShieldCheck, X, Zap, AlertTriangle, Lock } from 'lucide-react';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SafetyModal({ isOpen, onClose }: SafetyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-white space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Safety & Trust</h3>
              <p className="text-xs text-neutral-400">Your privacy and protection in Supertime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            aria-label="Close safety dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key Safety Pillars */}
        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Peer-to-Peer Encryption</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Video and audio calls connect directly between devices via WebRTC. Streams are never recorded or stored on our servers.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 flex items-start gap-3">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">1-Tap Instant Skip</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                If someone makes you uncomfortable, tap Next to immediately disconnect. Matches are random and non-persistent.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Zero Tolerance Policy (18+)</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Nudity, harassment, hate speech, and abusive behavior trigger an immediate permanent device ban across our network.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-white/10"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
