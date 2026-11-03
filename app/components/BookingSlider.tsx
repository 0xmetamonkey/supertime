/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  Sparkles,
  Zap,
  CheckCircle2,
  Video,
  Mic,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export type BookingUnit = 'min' | 'hr' | 'day' | 'week' | 'month';

interface BookingSliderProps {
  username: string;
  artistName?: string;
  rates?: {
    videoRate?: number;
    audioRate?: number;
    hourlyRate?: number;
    dailyRate?: number;
    weeklyRate?: number;
    monthlyRate?: number;
  };
  onBook?: (details: {
    unit: BookingUnit;
    duration: number;
    durationLabel: string;
    totalPrice: number;
    callType: 'video' | 'audio';
  }) => void;
}

interface UnitConfig {
  unit: BookingUnit;
  label: string;
  shortLabel: string;
  singular: string;
  plural: string;
  min: number;
  max: number;
  step: number;
  defaultVal: number;
  presets: number[];
  badge?: string;
  perks: string[];
}

const UNIT_CONFIGS: Record<BookingUnit, UnitConfig> = {
  min: {
    unit: 'min',
    label: "min's",
    shortLabel: 'Min',
    singular: 'Minute',
    plural: 'Minutes',
    min: 15,
    max: 120,
    step: 15,
    defaultVal: 30,
    presets: [15, 30, 45, 60, 90, 120],
    badge: 'Instant & Live',
    perks: [
      '1:1 HD Video/Audio Room session',
      'Instant calendar invite & room link',
      'Full call recording delivered afterward',
    ],
  },
  hr: {
    unit: 'hr',
    label: "Hr's",
    shortLabel: 'Hour',
    singular: 'Hour',
    plural: 'Hours',
    min: 1,
    max: 12,
    step: 1,
    defaultVal: 2,
    presets: [1, 2, 3, 4, 6, 8],
    badge: 'Deep Dive Collab',
    perks: [
      'Deep dive working & mentorship session',
      'Direct screen share & collaborative review',
      'Dedicated notes, resources & action plan',
    ],
  },
  day: {
    unit: 'day',
    label: 'Day',
    shortLabel: 'Day',
    singular: 'Day',
    plural: 'Days',
    min: 1,
    max: 14,
    step: 1,
    defaultVal: 2,
    presets: [1, 2, 3, 5, 7, 14],
    badge: 'Studio Residency',
    perks: [
      'Full day priority creative access',
      'Direct messaging on WhatsApp/Telegram',
      'Dedicated delivery of bespoke project assets',
    ],
  },
  week: {
    unit: 'week',
    label: 'week',
    shortLabel: 'Wk',
    singular: 'Week',
    plural: 'Weeks',
    min: 1,
    max: 8,
    step: 1,
    defaultVal: 2,
    presets: [1, 2, 3, 4, 6, 8],
    badge: 'Project Sprint',
    perks: [
      'Multi-week creative sprint or mentorship',
      'Scheduled checkpoint calls every week',
      'Async review and direct priority turnaround',
    ],
  },
  month: {
    unit: 'month',
    label: 'month',
    shortLabel: 'Mo',
    singular: 'Month',
    plural: 'Months',
    min: 1,
    max: 12,
    step: 1,
    defaultVal: 1,
    presets: [1, 2, 3, 6, 12],
    badge: 'Executive Retainer',
    perks: [
      'Dedicated monthly creative partner retainer',
      'Weekly scheduled 1:1 strategy calls',
      'VIP on-call access & end-to-end support',
    ],
  },
};

export default function BookingSlider({
  username,
  artistName,
  rates = {},
  onBook,
}: BookingSliderProps) {
  const [activeUnit, setActiveUnit] = useState<BookingUnit>('min');
  const [duration, setDuration] = useState<number>(30);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');

  // Base rates calculation
  const videoRate = rates.videoRate ?? 100;
  const audioRate = rates.audioRate ?? 50;

  const resolvedRates = useMemo(() => {
    const minRate = callType === 'video' ? videoRate : audioRate;
    const hrRate = rates.hourlyRate ?? Math.round(minRate * 60 * 0.85);
    const dayRate = rates.dailyRate ?? Math.round(hrRate * 6 * 0.80);
    const wkRate = rates.weeklyRate ?? Math.round(dayRate * 5 * 0.75);
    const moRate = rates.monthlyRate ?? Math.round(wkRate * 4 * 0.70);

    return {
      min: minRate,
      hr: hrRate,
      day: dayRate,
      week: wkRate,
      month: moRate,
    };
  }, [rates, videoRate, audioRate, callType]);

  const currentConfig = UNIT_CONFIGS[activeUnit];

  // Handle unit switch
  const handleUnitChange = (unit: BookingUnit) => {
    setActiveUnit(unit);
    setDuration(UNIT_CONFIGS[unit].defaultVal);
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    const unitPrice = resolvedRates[activeUnit];
    return duration * unitPrice;
  }, [activeUnit, duration, resolvedRates]);

  // Formatted duration label
  const durationLabel = `${duration} ${duration === 1 ? currentConfig.singular : currentConfig.plural}`;

  // Progress percentage for slider background
  const sliderProgress = ((duration - currentConfig.min) / (currentConfig.max - currentConfig.min)) * 100;

  const handleBookClick = () => {
    if (onBook) {
      onBook({
        unit: activeUnit,
        duration,
        durationLabel,
        totalPrice,
        callType,
      });
    }
  };

  return (
    <div className="w-full bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-foreground/10 text-foreground px-2.5 py-0.5 rounded-full">
              Flexible Booking Slider
            </span>
            <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Instant Confirmation
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Book Time with {artistName || `@${username}`}
          </h3>
          <p className="text-xs text-muted mt-1">
            Slide to customize your exact duration — from a quick 15-minute call to multi-month studio retainers.
          </p>
        </div>

        {/* Video / Audio Toggle for minute calls */}
        {activeUnit === 'min' && (
          <div className="flex bg-background border border-border rounded-xl p-1 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCallType('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                callType === 'video'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
            <button
              type="button"
              onClick={() => setCallType('audio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                callType === 'audio'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>
          </div>
        )}
      </div>

      {/* 5-Tier Unit Switcher (min's, Hr's, Day, week, month) */}
      <div className="mb-8">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-3">
          Select Duration Tier
        </label>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 bg-background border border-border p-1.5 rounded-2xl">
          {(['min', 'hr', 'day', 'week', 'month'] as BookingUnit[]).map((unitKey) => {
            const conf = UNIT_CONFIGS[unitKey];
            const isSelected = activeUnit === unitKey;
            return (
              <button
                key={unitKey}
                type="button"
                onClick={() => handleUnitChange(unitKey)}
                className={`py-3 px-1 sm:px-2 rounded-xl text-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-muted hover:text-foreground hover:bg-surface'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold tracking-tight capitalize">
                  {conf.label}
                </div>
                <div className={`text-[10px] hidden sm:block font-medium truncate mt-0.5 ${isSelected ? 'text-background/80' : 'text-muted'}`}>
                  {conf.shortLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Big Duration Display & Slider */}
      <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-6xl font-black tracking-tight text-foreground font-mono">
              {duration}
            </span>
            <span className="text-lg sm:text-2xl font-bold uppercase tracking-wider text-muted">
              {duration === 1 ? currentConfig.singular : currentConfig.plural}
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-muted block uppercase tracking-wider font-semibold">Investment</span>
            <span className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              ₹{totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="relative mb-5">
          <input
            type="range"
            min={currentConfig.min}
            max={currentConfig.max}
            step={currentConfig.step}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-3 bg-surface rounded-lg appearance-none cursor-pointer accent-foreground focus:outline-none"
            style={{
              background: `linear-gradient(to right, var(--foreground, #000) 0%, var(--foreground, #000) ${sliderProgress}%, rgba(120, 120, 120, 0.2) ${sliderProgress}%, rgba(120, 120, 120, 0.2) 100%)`
            }}
          />
          <div className="flex justify-between text-[11px] font-mono text-muted mt-2">
            <span>{currentConfig.min} {currentConfig.shortLabel}</span>
            <span>{currentConfig.max} {currentConfig.shortLabel}</span>
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          <span className="text-[11px] text-muted font-medium mr-1">Quick Select:</span>
          {currentConfig.presets.map((p) => {
            const isCur = duration === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setDuration(p)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCur
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-surface border border-border text-muted hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                {p} {currentConfig.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Perks Included List */}
      <div className="bg-surface/50 border border-border/70 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>What&apos;s Included in this {currentConfig.label} Booking</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {currentConfig.perks.map((perk, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-muted flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>100% Guaranteed Session · Calendar invite synced to Google/Apple Calendar</span>
        </div>

        <button
          type="button"
          onClick={handleBookClick}
          className="w-full sm:w-auto px-8 py-4 bg-foreground text-background font-bold text-sm sm:text-base rounded-2xl hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-3 shadow-lg cursor-pointer"
        >
          <span>Book {durationLabel} (₹{totalPrice.toLocaleString()})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

