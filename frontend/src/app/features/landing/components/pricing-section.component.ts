import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { NodesService } from '../../../core/services/nodes.service';
import { PublicPricing } from '../../../core/models/admin.model';
import { GPU_PRICING, GpuPricing } from '../../../core/constants/pricing.constants';
import { HubspotFormModalComponent } from './hubspot-form-modal.component';

interface PricingItem {
  gpuType: string;
  pricePerHour: number | null;
  isContactSales: boolean;
  specs: GpuPricing | undefined;
}

@Component({
  selector: 'app-pricing-section',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollRevealDirective, DecimalPipe, HubspotFormModalComponent],
  templateUrl: './pricing-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingSectionComponent implements OnInit {
  private readonly nodesService = inject(NodesService);

  protected readonly pricing = signal<PricingItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly isModalOpen = signal(false);
  protected readonly selectedGpuType = signal<string | null>(null);

  public ngOnInit(): void {
    this.loadPricing();
  }

  private loadPricing(): void {
    this.nodesService.getPublicPricing().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.pricing.set(
            data.map((item) => ({
              gpuType: item.gpuType,
              pricePerHour: item.pricePerHour,
              isContactSales: item.isContactSales,
              specs: this.getGpuSpecs(item.gpuType),
            }))
          );
        } else {
          this.useFallbackPricing();
        }
        this.loading.set(false);
      },
      error: () => {
        this.useFallbackPricing();
        this.loading.set(false);
      },
    });
  }

  private useFallbackPricing(): void {
    this.pricing.set(
      GPU_PRICING.map((g) => ({
        gpuType: g.id,
        pricePerHour: g.pricePerHour,
        isContactSales: g.pricePerHour === null,
        specs: g,
      }))
    );
  }

  private getGpuSpecs(gpuType: string): GpuPricing | undefined {
    return GPU_PRICING.find((g) => g.id === gpuType);
  }

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
