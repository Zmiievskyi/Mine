/**
 * GPU Pricing Data
 * Hardcoded pricing information for GPU server packages
 */

export interface GpuPricing {
  name: string;
  description: string;
  pricePerHour: number | null;
  pricePerMonth: number | null;
  isContactSales: boolean;
  features: string[];
}

/**
 * Single source of truth for per-GPU hourly rate (USD).
 * Keyed by short GPU name (matches efficiency.ts and API route usage).
 * Any price change happens here and propagates to:
 *   - `pricing` below (monthly is recomputed from this)
 *   - `efficiency.ts` (efficiency is `weight / pricePerHour`)
 *   - `/api/gpu-weights` (live efficiency calc)
 */
export const GPU_HOURLY_RATES = {
  H100: 2.1,
  H200: 3.05,
  B200: 5.8,
  B300: 10.0,
} as const satisfies Record<string, number>;

export type GpuShortName = keyof typeof GPU_HOURLY_RATES;

/**
 * Monthly price derived from hourly, rounded to the nearest hundred
 * (matches the stored values in the `pricing` array below).
 */
function deriveMonthlyPrice(pricePerHour: number): number {
  return Math.round((pricePerHour * 8 * 730) / 100) * 100;
}

/**
 * Hardcoded GPU pricing data
 * Monthly = hourly × 8 GPUs × 730 hours/month, rounded to nearest $100
 */
export const pricing: GpuPricing[] = [
  {
    name: '8x H100 Server',
    description: 'Next-gen AI training powerhouse',
    pricePerHour: GPU_HOURLY_RATES.H100,
    pricePerMonth: deriveMonthlyPrice(GPU_HOURLY_RATES.H100),
    isContactSales: false,
    features: [
      '8x NVIDIA H100 80GB',
      '80GB HBM3 memory per GPU',
      '4TB NVMe storage',
      '24/7 monitoring',
      'Managed infrastructure',
    ],
  },
  {
    name: '8x H200 Server',
    description: 'Maximum memory for large models',
    pricePerHour: GPU_HOURLY_RATES.H200,
    pricePerMonth: deriveMonthlyPrice(GPU_HOURLY_RATES.H200),
    isContactSales: false,
    features: [
      '8x NVIDIA H200 141GB',
      '141GB HBM3e memory per GPU',
      '8TB NVMe storage',
      '24/7 monitoring',
      'Managed infrastructure',
    ],
  },
  {
    name: '8x B200 Server',
    description: 'Latest Blackwell architecture',
    pricePerHour: GPU_HOURLY_RATES.B200,
    pricePerMonth: deriveMonthlyPrice(GPU_HOURLY_RATES.B200),
    isContactSales: false,
    features: [
      '8x NVIDIA B200 192GB',
      '192GB HBM3e memory per GPU',
      '8TB NVMe storage',
      '24/7 monitoring',
      'Managed infrastructure',
    ],
  },
  {
    name: '8x B300 Server',
    description: 'Newest Blackwell Ultra GPU server',
    pricePerHour: GPU_HOURLY_RATES.B300,
    pricePerMonth: deriveMonthlyPrice(GPU_HOURLY_RATES.B300),
    isContactSales: false,
    features: [
      '8x NVIDIA B300 192GB',
      '192GB HBM3e memory per GPU',
      '8TB NVMe storage',
      '24/7 monitoring',
      'Managed infrastructure',
    ],
  },
];

/**
 * Maps our locale codes to Intl.NumberFormat locale strings
 */
const localeMap: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  zh: 'zh-CN',
};

/**
 * Formats a price value with 2 decimal places
 * @param price - Price value to format
 * @param locale - Locale code (en, ru, zh) for number formatting
 * @returns Formatted price string with locale-appropriate separators and 2 decimals
 */
export function formatPrice(price: number, locale: string = 'en'): string {
  const intlLocale = localeMap[locale] || 'en-US';
  return price.toLocaleString(intlLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a monthly price value with no decimal places
 * @param price - Monthly price value to format
 * @param locale - Locale code (en, ru, zh) for number formatting
 * @returns Formatted price string with locale-appropriate separators and no decimals
 */
export function formatMonthlyPrice(price: number, locale: string = 'en'): string {
  const intlLocale = localeMap[locale] || 'en-US';
  return price.toLocaleString(intlLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
