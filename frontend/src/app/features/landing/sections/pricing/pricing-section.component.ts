import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  GPU_PRICING,
  GpuPricing,
  CURRENCY,
  getAvailableGpus
} from '../../../../core/constants/pricing.constants';

/**
 * Pricing section component for MineGNK landing page
 *
 * Displays GPU mining packages from Gcore pricing.
 * Uses centralized pricing constants for consistency.
 */
@Component({
  selector: 'app-pricing-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pricing-section.component.html',
  styleUrl: './pricing-section.component.scss'
})
export class PricingSectionComponent {
  /** All GPU pricing options */
  gpus = GPU_PRICING;

  /** Currency symbol */
  currency = CURRENCY;

  /**
   * Handle CTA button clicks
   */
  onSelectGpu(gpu: GpuPricing): void {
    if (!gpu.available) {
      window.location.href = 'mailto:sales@gcore.com?subject=H200 GPU Inquiry';
    }
  }
}
