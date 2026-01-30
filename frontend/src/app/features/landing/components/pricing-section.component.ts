import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { HubspotFormModalComponent } from './hubspot-form-modal.component';

interface GpuPricing {
  name: string;
  description: string;
  pricePerHour: number | null;
  pricePerMonth: number | null;
  isContactSales: boolean;
  features: string[];
}

/**
 * Pricing section component with static GPU pricing data.
 * All pricing is hardcoded for the static landing page.
 */
@Component({
  selector: 'app-pricing-section',
  standalone: true,
  imports: [ScrollRevealDirective, DecimalPipe, HubspotFormModalComponent],
  templateUrl: './pricing-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingSectionComponent {
  protected readonly isModalOpen = signal(false);
  protected readonly selectedGpuType = signal<string | null>(null);

  // Hardcoded GPU pricing data
  // Monthly = hourly × 8 GPUs × 730 hours/month
  protected readonly pricing: GpuPricing[] = [
    {
      name: 'A100',
      description: 'Entry-level high-performance GPU',
      pricePerHour: 0.99,
      pricePerMonth: 5782, // 0.99 × 8 × 730
      isContactSales: false,
      features: [
        '8x NVIDIA A100 80GB',
        '80GB HBM2e memory per GPU',
        '2TB NVMe storage',
        '24/7 monitoring',
        'Managed infrastructure'
      ]
    },
    {
      name: 'H100',
      description: 'Next-gen AI training powerhouse',
      pricePerHour: 1.80,
      pricePerMonth: 10512, // 1.80 × 8 × 730
      isContactSales: false,
      features: [
        '8x NVIDIA H100 80GB',
        '80GB HBM3 memory per GPU',
        '4TB NVMe storage',
        '24/7 monitoring',
        'Managed infrastructure'
      ]
    },
    {
      name: 'H200',
      description: 'Maximum memory for large models',
      pricePerHour: 2.40,
      pricePerMonth: 14016, // 2.40 × 8 × 730
      isContactSales: false,
      features: [
        '8x NVIDIA H200 141GB',
        '141GB HBM3e memory per GPU',
        '8TB NVMe storage',
        '24/7 monitoring',
        'Managed infrastructure'
      ]
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
        'Managed infrastructure'
      ]
    }
  ];

  protected openModal(gpuType: string): void {
    this.selectedGpuType.set(gpuType);
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedGpuType.set(null);
  }

  protected onFormSubmitted(): void {
    setTimeout(() => this.closeModal(), 3000);
  }
}
