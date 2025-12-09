/**
 * GPU Pricing Constants
 *
 * Single source of truth for all GPU pricing data.
 * Prices from gcore.com/pricing/ai (December 2024)
 */

export type GpuType = 'L40S' | 'A100' | 'H100' | 'H200';

export interface GpuPricing {
  id: GpuType;
  name: string;
  vram: string;
  pricePerHour: number | null;  // EUR, null = contact sales
  pricePerMonth: number | null; // EUR, calculated from hourly * 720
  available: boolean;
  badge?: string;
  features: string[];
  estimatedTokensPerDay?: string;
}

export const CURRENCY = '€';
export const HOURS_PER_MONTH = 720; // 30 days * 24 hours

/**
 * GPU pricing data from gcore.com/pricing/ai
 * Last updated: December 2024
 */
export const GPU_PRICING: GpuPricing[] = [
  {
    id: 'L40S',
    name: 'NVIDIA L40S',
    vram: '48 GB',
    pricePerHour: 1.34,
    pricePerMonth: 1.34 * HOURS_PER_MONTH,
    available: true,
    badge: 'Entry Level',
    features: [
      '48GB GDDR6 memory',
      'Ada Lovelace architecture',
      '18,176 CUDA cores',
      '24/7 monitoring',
      'Email support'
    ],
    estimatedTokensPerDay: '~8-12 GNK'
  },
  {
    id: 'A100',
    name: 'NVIDIA A100',
    vram: '80 GB',
    pricePerHour: 1.67,
    pricePerMonth: 1.67 * HOURS_PER_MONTH,
    available: true,
    badge: 'Popular',
    features: [
      '80GB HBM2e memory',
      'Ampere architecture',
      '6,912 CUDA cores',
      '24/7 monitoring',
      'Priority support'
    ],
    estimatedTokensPerDay: '~15-20 GNK'
  },
  {
    id: 'H100',
    name: 'NVIDIA H100',
    vram: '80 GB',
    pricePerHour: 2.76,
    pricePerMonth: 2.76 * HOURS_PER_MONTH,
    available: true,
    badge: 'Best Performance',
    features: [
      '80GB HBM3 memory',
      'Hopper architecture',
      '16,896 CUDA cores',
      '24/7 monitoring',
      'Dedicated support'
    ],
    estimatedTokensPerDay: '~50-60 GNK'
  },
  {
    id: 'H200',
    name: 'NVIDIA H200',
    vram: '141 GB',
    pricePerHour: null,
    pricePerMonth: null,
    available: false,
    badge: 'Coming Soon',
    features: [
      '141GB HBM3e memory',
      'Hopper architecture',
      'Maximum performance',
      'Custom integrations',
      'Enterprise SLA'
    ],
    estimatedTokensPerDay: '~80-100 GNK'
  }
];

/**
 * Get GPU by ID
 */
export function getGpuById(id: GpuType): GpuPricing | undefined {
  return GPU_PRICING.find(gpu => gpu.id === id);
}

/**
 * Get available GPUs only
 */
export function getAvailableGpus(): GpuPricing[] {
  return GPU_PRICING.filter(gpu => gpu.available);
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null): string {
  if (price === null) return 'Contact Sales';
  return `${CURRENCY}${price.toFixed(2)}`;
}

/**
 * Format hourly price
 */
export function formatHourlyPrice(price: number | null): string {
  if (price === null) return 'Contact Sales';
  return `${CURRENCY}${price.toFixed(2)}/hr`;
}

/**
 * Format monthly price
 */
export function formatMonthlyPrice(price: number | null): string {
  if (price === null) return 'Contact Sales';
  return `${CURRENCY}${Math.round(price)}/mo`;
}
