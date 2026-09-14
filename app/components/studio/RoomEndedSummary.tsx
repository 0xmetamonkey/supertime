'use client';

import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface RoomEndedSummaryProps {
  roomTitle: string;
  durationText: string;
  guestName?: string;
  dateText?: string;
  onBackToStudio: () => void;
  onViewSummary?: () => void;
}

export default function RoomEndedSummary({
  roomTitle = '1 : 1',
  durationText = '28 min',
  guestName = 'Priya S.',
  dateText = 'Today',
  onBackToStudio,
  onViewSummary,
}: RoomEndedSummaryProps) {
  return (
    <div className="fixed inset-0 z-70 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white max-w-lg mx-auto flex flex-col justify-between p-6 animate-in fade-in duration-200">
      <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
        {/* Checkmark Badge */}
        <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6 shadow-sm">
          <Check className="w-10 h-10 text-neutral-900 dark:text-white stroke-[2.5]" />
        </div>

        <h3 className="text-xl font-bold tracking-tight mb-1">
          {roomTitle} • {durationText}
        </h3>
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          with {guestName}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          {dateText}
        </p>
      </div>

      {/* CTAs */}
      <div className="w-full space-y-3 pb-4">
        {onViewSummary && (
          <button
            onClick={onViewSummary}
            className="w-full py-3.5 rounded-full border border-neutral-200 dark:border-neutral-800 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
          >
            View summary
          </button>
        )}

        <button
          onClick={onBackToStudio}
          className="w-full py-4 rounded-full bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-950 font-semibold text-sm transition-all shadow-md active:scale-98"
        >
          Back to Studio
        </button>
      </div>
    </div>
  );
}
