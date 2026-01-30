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
    name: 'A100',
    description: 'Entry-level high-performance GPU',
    pricePerHour: 0.99,
    pricePerMonth: 5782,
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
    name: 'H100',
    description: 'Next-gen AI training powerhouse',
    pricePerHour: 1.8,
    pricePerMonth: 10512,
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
    name: 'H200',
    description: 'Maximum memory for large models',
    pricePerHour: 2.4,
    pricePerMonth: 14016,
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
    name: 'B200',
    description: 'Latest Blackwell architecture',
    pricePerHour: null,
    pricePerMonth: null,
    isContactSales: true,
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
 * Formats a price value with 2 decimal places
 * @param price - Price value to format
 * @returns Formatted price string with commas and 2 decimals
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a monthly price value with no decimal places
 * @param price - Monthly price value to format
 * @returns Formatted price string with commas and no decimals
 */
export function formatMonthlyPrice(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
