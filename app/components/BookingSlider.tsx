'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { BookingUnit, BookingTierConfig, BookingRates, BookingRequest } from '@/types/offerings';

// ─── Tier Configs ────────────────────────────────────────────────────

function buildTiers(rates: BookingRates): BookingTierConfig[] {
  return [
    {
      unit: 'minutes',
      label: 'Min',
      singular: 'Minute',
      plural: 'Minutes',
      min: 15,
      max: 90,
      step: 15,
      defaultValue: 30,
      rate: rates.minuteRate,
    },
    {
      unit: 'hours',
      label: 'Hr',
      singular: 'Hour',
      plural: 'Hours',
      min: 1,
      max: 8,
      step: 1,
      defaultValue: 1,
      rate: rates.hourlyRate,
    },
    {
      unit: 'days',
      label: 'Day',
      singular: 'Day',
      plural: 'Days',
      min: 1,
      max: 14,
      step: 1,
      defaultValue: 1,
      rate: rates.dailyRate,
    },
    {
      unit: 'weeks',
      label: 'Wk',
      singular: 'Week',
      plural: 'Weeks',
      min: 1,
      max: 4,
      step: 1,
      defaultValue: 1,
      rate: rates.weeklyRate,
    },
    {
      unit: 'months',
      label: 'Mo',
      singular: 'Month',
      plural: 'Months',
      min: 1,
      max: 6,
      step: 1,
      defaultValue: 1,
      rate: rates.monthlyRate,
    },
  ];
}

// ─── Props ───────────────────────────────────────────────────────────

interface BookingSliderProps {
  rates: BookingRates;
  onBook?: (request: BookingRequest) => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function BookingSlider({ rates, onBook }: BookingSliderProps) {
  const tiers = useMemo(() => buildTiers(rates), [rates]);

  const [activeUnit, setActiveUnit] = useState<BookingUnit>('minutes');
  const [values, setValues] = useState<Record<BookingUnit, number>>(() => {
    const m: Record<string, number> = {};
    for (const t of tiers) m[t.unit] = t.defaultValue;
    return m as Record<BookingUnit, number>;
  });

  const tier = tiers.find((t) => t.unit === activeUnit)!;
  const quantity = values[activeUnit];
  const totalPrice = quantity * tier.rate;

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [activeUnit]: Number(e.target.value) }));
    },
    [activeUnit],
  );

  const handleBook = () => {
    onBook?.({
      unit: activeUnit,
      quantity,
      totalPrice,
      ratePerUnit: tier.rate,
    });
  };

  // Slider fill percentage for the custom track
  const pct = ((quantity - tier.min) / (tier.max - tier.min)) * 100;

  return (
    <div className="w-full rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-5">
      {/* ── Unit Tabs ─────────────────────────────────────────────── */}
      <div className="flex rounded-xl bg-background p-1 gap-1">
        {tiers.map((t) => (
          <button
            key={t.unit}
            onClick={() => setActiveUnit(t.unit)}
            className={`flex-1 text-xs sm:text-sm font-semibold py-2 rounded-lg transition-colors ${
              activeUnit === t.unit
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Rate Badge ────────────────────────────────────────────── */}
      <p className="text-xs text-muted text-center">
        ₹{tier.rate.toLocaleString()} / {tier.singular.toLowerCase()}
      </p>

      {/* ── Slider ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <input
          type="range"
          min={tier.min}
          max={tier.max}
          step={tier.step}
          value={quantity}
          onChange={handleSlider}
          className="w-full accent-foreground cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-foreground) ${pct}%, var(--color-border) ${pct}%)`,
          }}
        />

        <div className="flex justify-between text-[11px] text-muted font-medium tabular-nums">
          <span>
            {tier.min} {tier.min === 1 ? tier.singular : tier.plural}
          </span>
          <span className="text-foreground font-semibold text-sm">
            {quantity} {quantity === 1 ? tier.singular : tier.plural}
          </span>
          <span>
            {tier.max} {tier.plural}
          </span>
        </div>
      </div>

      {/* ── Total + Book Button ───────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-wider font-medium">Total</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            ₹{totalPrice.toLocaleString()}
          </p>
        </div>

        <button
          onClick={handleBook}
          className="px-6 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

