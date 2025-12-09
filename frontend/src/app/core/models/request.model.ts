import {
  GpuType,
  GPU_PRICING,
  CURRENCY,
  formatHourlyPrice
} from '../constants/pricing.constants';

export type { GpuType } from '../constants/pricing.constants';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface NodeRequest {
  id: string;
  gpuType: GpuType;
  gpuCount: number;
  region?: string;
  message?: string;
  status: RequestStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface CreateRequestDto {
  gpuType: GpuType;
  gpuCount: number;
  region?: string;
  message?: string;
}

/**
 * GPU options for request form
 * Derived from centralized pricing constants
 */
export const GPU_OPTIONS = GPU_PRICING
  .filter(gpu => gpu.available)
  .map(gpu => ({
    value: gpu.id,
    label: gpu.name,
    price: formatHourlyPrice(gpu.pricePerHour),
    vram: gpu.vram
  }));

export const REGION_OPTIONS = [
  { value: 'eu-west', label: 'Europe (Luxembourg)' },
  { value: 'us-east', label: 'US East' },
  { value: 'asia-pacific', label: 'Asia Pacific' },
];
