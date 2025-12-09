/**
 * GPU Pricing Constants
 *
 * Single source of truth for all GPU pricing data.
 * Prices from gcore.com/pricing/ai (December 2024)
 */

export type GpuType = 'A100' | 'H100' | 'H200';

export interface GpuPricing {
  id: GpuType;
  name: string;
  vram: string;
  pricePerHour: number | null;  // EUR, null = contact sales
  pricePerMonth: number | null; // EUR, calculated from hourly * 720
  available: boolean;
  description?: string;
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
    id: 'A100',
    name: 'A100',
    vram: '80 GB',
    pricePerHour: 1.67,
    pricePerMonth: 1.67 * HOURS_PER_MONTH,
    available: true,
    description: 'Data center GPU for AI workloads',
    features: [
      '80GB HBM2e memory',
      '6,912 CUDA cores',
      'Ampere architecture',
      '24/7 monitoring',
      'Email support'
    ],
    estimatedTokensPerDay: '~15-20 GNK'
  },
  {
    id: 'H100',
    name: 'H100',
    vram: '80 GB',
    pricePerHour: 2.76,
    pricePerMonth: 2.76 * HOURS_PER_MONTH,
    available: true,
    description: 'Next-gen Hopper GPU for maximum performance',
    features: [
      '80GB HBM3 memory',
      '16,896 CUDA cores',
      'Hopper architecture',
      'Priority support',
      '3200 Gbps InfiniBand'
    ],
    estimatedTokensPerDay: '~50-60 GNK'
  },
  {
    id: 'H200',
    name: 'H200',
    vram: '141 GB',
    pricePerHour: null,
    pricePerMonth: null,
    available: true,
    description: 'Latest Hopper with 141GB HBM3e memory',
    features: [
      '141GB HBM3e memory',
      '16,896 CUDA cores',
      'Dedicated support & SLA guarantees',
      '3200 Gbps InfiniBand',
      'Volume discounts'
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
