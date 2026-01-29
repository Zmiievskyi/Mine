/**
 * GPU Pricing Constants
 *
 * Single source of truth for all GPU pricing data.
 * Prices from gnk.revops.it.com (January 2025)
 * Currency: USD
 */

/**
 * Minimum hourly price in USD for validation
 * Set to 0 to allow free-tier or promotional pricing
 */
export const MIN_HOURLY_PRICE_USD = 0;

/**
 * Maximum hourly price in USD for validation
 * Safety limit to prevent accidental data entry errors (e.g., entering 1000 instead of 10.00)
 * Based on current market rates for high-end datacenter GPUs (B200 = $3.50/hr)
 */
export const MAX_HOURLY_PRICE_USD = 100;

export type GpuType = 'A100' | 'H100' | 'H200' | 'B200';

export interface GpuPricing {
  id: GpuType;
  name: string;
  vram: string;
  pricePerHour: number | null;  // USD, null = contact sales
  available: boolean;
  description?: string;
  features: string[];
  estimatedTokensPerDay?: string;
}

export const CURRENCY = '$';
export const HOURS_PER_MONTH = 730; // Average month (365/12 * 24)
export const GPUS_PER_SERVER = 8;

/**
 * Calculate monthly price for 8x GPU server
 * Formula: hourlyPrice × 8 GPUs × 730 hours/month
 */
export function calculateMonthlyPrice(hourlyPrice: number | null): number | null {
  if (hourlyPrice === null) return null;
  return Math.round(hourlyPrice * GPUS_PER_SERVER * HOURS_PER_MONTH);
}

/**
 * GPU pricing data - 8x GPU server configurations
 * Prices from gnk.revops.it.com (January 2025)
 * Month-to-month contracts, volume discounts from 10+ servers
 */
export const GPU_PRICING: GpuPricing[] = [
  {
    id: 'A100',
    name: '8x A100 Server',
    vram: '80 GB',
    pricePerHour: 0.99,
    available: true,
    description: 'Enterprise GPU for AI inference workloads',
    features: [
      '80GB HBM2e memory per GPU',
      'Ampere architecture',
      'Month-to-month contract',
      '24/7 infrastructure monitoring',
      'Business hours support'
    ],
    estimatedTokensPerDay: '~15-20 GNK'
  },
  {
    id: 'H100',
    name: '8x H100 Server',
    vram: '80 GB',
    pricePerHour: 1.80,
    available: true,
    description: 'High-performance Hopper GPU for demanding workloads',
    features: [
      '80GB HBM3 memory per GPU',
      'Hopper architecture',
      'Month-to-month contract',
      'Priority support',
      '3200 Gbps InfiniBand'
    ],
    estimatedTokensPerDay: '~50-60 GNK'
  },
  {
    id: 'H200',
    name: '8x H200 Server',
    vram: '141 GB',
    pricePerHour: 2.40,
    available: true,
    description: 'Latest Hopper with expanded HBM3e memory',
    features: [
      '141GB HBM3e memory per GPU',
      'Hopper architecture',
      'Month-to-month contract',
      'Dedicated support & SLA',
      'Volume discounts available'
    ],
    estimatedTokensPerDay: '~80-100 GNK'
  },
  {
    id: 'B200',
    name: '8x B200 Server',
    vram: '192 GB',
    pricePerHour: 3.50,
    available: true,
    description: 'Next-gen Blackwell architecture for maximum performance',
    features: [
      '192GB HBM3e memory per GPU',
      'Blackwell architecture',
      'Month-to-month contract',
      'Priority support & SLA',
      'Volume discounts available'
    ],
    estimatedTokensPerDay: '~120-150 GNK'
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
 * Format hourly price for display
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

/**
 * Get GPU label (display name) by type
 */
export function getGpuLabel(type: GpuType | string): string {
  const gpu = GPU_PRICING.find(g => g.id === type);
  return gpu ? gpu.name : type;
}
