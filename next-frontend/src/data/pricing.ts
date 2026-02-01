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
 * Hardcoded GPU pricing data
 * Monthly = hourly × 8 GPUs × 730 hours/month
 */
export const pricing: GpuPricing[] = [
  {
    name: '8x A100 Server',
    description: 'Entry-level high-performance GPU',
    pricePerHour: 0.99,
    pricePerMonth: 5780,
    isContactSales: false,
    features: [
      '8x NVIDIA A100 80GB',
      '80GB HBM2e memory per GPU',
      '2TB NVMe storage',
      '24/7 monitoring',
      'Managed infrastructure',
    ],
  },
  {
    name: '8x H100 Server',
    description: 'Next-gen AI training powerhouse',
    pricePerHour: 1.8,
    pricePerMonth: 10510,
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
    pricePerHour: 2.4,
    pricePerMonth: 14020,
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
    pricePerHour: 3.02,
    pricePerMonth: 17640,
    isContactSales: false,
    features: [
      '8x NVIDIA B200 192GB',
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
