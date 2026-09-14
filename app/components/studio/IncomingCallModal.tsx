'use client';

import React from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';

interface IncomingCallModalProps {
  callerName: string;
  roomTypeLabel: string;
  durationLabel: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({
  callerName,
  roomTypeLabel,
  durationLabel,
  onAccept,
  onDecline,
}: IncomingCallModalProps) {
  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400 mb-6">
          Incoming Request
        </span>

        {/* Large Avatar */}
        <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 ring-8 ring-neutral-50 dark:ring-neutral-800/50">
          <User className="w-12 h-12 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
        </div>

        <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {callerName}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          wants to join your room
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
          {roomTypeLabel} • {durationLabel}
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full mt-8">
          <button
            onClick={onDecline}
            className="flex-1 py-3.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 font-semibold text-sm transition-all shadow-md active:scale-95"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
