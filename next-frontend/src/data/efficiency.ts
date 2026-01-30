/**
 * GPU Efficiency Data
 * Hardcoded efficiency information for GPU comparison
 */

export interface GpuEfficiency {
  name: string;
  weight: number;
  pricePerHour: number;
  efficiency: number;
  isEstimated?: boolean;
}

/**
 * Static GPU efficiency data (fallback weights from Gonka network)
 * Efficiency = weight / pricePerHour (higher = better value)
 * Note: B200 uses estimated pricing for efficiency calculation
 */
export const gpuEfficiencyData: GpuEfficiency[] = [
  { name: 'A100', weight: 256.498, pricePerHour: 0.99, efficiency: 259.09 },
  { name: 'H100', weight: 606.046, pricePerHour: 1.80, efficiency: 336.69 },
  { name: 'H200', weight: 619.000, pricePerHour: 2.40, efficiency: 257.92 },
  { name: 'B200', weight: 955.921, pricePerHour: 3.02, efficiency: 316.53, isEstimated: true },
];

// Sort by efficiency (highest first) and find best value
export const sortedByEfficiency = [...gpuEfficiencyData].sort(
  (a, b) => b.efficiency - a.efficiency
);

export const maxEfficiency = sortedByEfficiency[0]?.efficiency ?? 1;
export const bestValueGpu = sortedByEfficiency[0]?.name;
