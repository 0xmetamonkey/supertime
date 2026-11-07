// types/offerings.ts
// Shared type definitions for Booking Slider & Menu Manager features

// ─── Booking Slider Types ────────────────────────────────────────────

/** The five bookable time-unit tiers */
export type BookingUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months';

/** Configuration for a single booking tier */
export interface BookingTierConfig {
  unit: BookingUnit;
  label: string;          // Display label for tab — e.g. "Min"
  singular: string;       // "Minute"
  plural: string;         // "Minutes"
  min: number;            // Minimum selectable value
  max: number;            // Maximum selectable value
  step: number;           // Slider step increment
  defaultValue: number;   // Initial slider position
  rate: number;           // Price per unit (₹)
}

/** Rates that the artist configures (stored in KV / DB) */
export interface BookingRates {
  minuteRate: number;     // ₹ per minute
  hourlyRate: number;     // ₹ per hour
  dailyRate: number;      // ₹ per day
  weeklyRate: number;     // ₹ per week
  monthlyRate: number;    // ₹ per month
}

/** Emitted when a fan clicks "Book" */
export interface BookingRequest {
  unit: BookingUnit;
  quantity: number;
  totalPrice: number;
  ratePerUnit: number;
}

// ─── Menu / Store Types ──────────────────────────────────────────────

/** A single item inside a menu category */
export interface MenuItem {
  id: string;
  title: string;
  price: number;          // ₹
  description?: string;
}

/** A category that groups multiple menu items */
export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}
