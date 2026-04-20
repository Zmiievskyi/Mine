/**
 * GPU Efficiency Data
 * Hardcoded weights; hourly price and efficiency are derived from `pricing.ts`
 */

import { GPU_HOURLY_RATES, type GpuShortName } from './pricing';

export interface GpuEfficiency {
  name: string;
  weight: number;
  pricePerHour: number;
  efficiency: number;
  isEstimated?: boolean;
}

interface GpuWeight {
  name: GpuShortName;
  weight: number;
  isEstimated?: boolean;
}

/**
 * Raw per-GPU weights from the Gonka network (fallback data).
 * These values need to be manually updated if Gonka's weight numbers change.
 */
const gpuWeights: GpuWeight[] = [
  { name: 'A100', weight: 100.593 },
  { name: 'H100', weight: 305.655 },
  { name: 'H200', weight: 240.674 },
  { name: 'B200', weight: 307.853, isEstimated: true },
];

/**
 * Static GPU efficiency data (fallback for the Gonka-backed API route).
 * Efficiency = weight / pricePerHour (higher = better value),
 * rounded to 2 decimals to stay stable across renders.
 */
export const gpuEfficiencyData: GpuEfficiency[] = gpuWeights.map(({ name, weight, isEstimated }) => {
  const pricePerHour = GPU_HOURLY_RATES[name];
  const efficiency = Number((weight / pricePerHour).toFixed(2));
  return isEstimated
    ? { name, weight, pricePerHour, efficiency, isEstimated }
    : { name, weight, pricePerHour, efficiency };
});

// Sort by efficiency (highest first) and find best value
export const sortedByEfficiency = [...gpuEfficiencyData].sort(
  (a, b) => b.efficiency - a.efficiency
);

export const maxEfficiency = sortedByEfficiency[0]?.efficiency ?? 1;
export const bestValueGpu = sortedByEfficiency[0]?.name;
