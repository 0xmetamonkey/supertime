// Maps ISO 2-letter country codes to a price multiplier
// 1.0 = Base Price (USD), < 1.0 = Discounted Price

export const PPP_MULTIPLIERS: Record<string, number> = {
  // North America & Western Europe (Base)
  US: 1.0,
  GB: 1.0,
  CA: 1.0,
  AU: 1.0,
  DE: 1.0,
  FR: 1.0,

  // Tier 2 (~20-30% discount)
  ES: 0.8,
  IT: 0.8,
  JP: 0.8,
  KR: 0.8,
  AE: 0.8,

  // Tier 3 (~50% discount)
  BR: 0.5,
  MX: 0.5,
  ZA: 0.5,
  TR: 0.5,
  RU: 0.5,
  CN: 0.5,

  // Tier 4 (~60-70% discount)
  IN: 0.35,
  ID: 0.35,
  PH: 0.35,
  VN: 0.35,
  NG: 0.35,
  PK: 0.35,
  BD: 0.35,
};

export const BASE_PRO_PRICE = 29; // $29 USD / month

/**
 * Returns the PPP multiplier for a given country code.
 * Defaults to 1.0 if the country is unknown or not explicitly discounted.
 */
export function getPPPMultiplier(countryCode: string | null | undefined): number {
  if (!countryCode) return 1.0;
  return PPP_MULTIPLIERS[countryCode.toUpperCase()] || 1.0;
}

/**
 * Calculates the localized price based on the country code.
 */
export function getLocalizedPrice(basePrice: number, countryCode: string | null | undefined) {
  const multiplier = getPPPMultiplier(countryCode);
  return Math.round(basePrice * multiplier);
}

/**
 * Returns the detected currency symbol for a rough estimate
 * Note: A robust system would use Intl.NumberFormat, but this is a quick proxy.
 */
export function getCurrencySymbol(countryCode: string | null | undefined): string {
  if (!countryCode) return '$';
  const code = countryCode.toUpperCase();
  if (code === 'IN') return '₹';
  if (code === 'GB') return '£';
  if (['DE', 'FR', 'ES', 'IT'].includes(code)) return '€';
  if (code === 'JP') return '¥';
  if (code === 'BR') return 'R$';
  return '$'; // Fallback to USD representation for others usually pegged to USD pricing
}
