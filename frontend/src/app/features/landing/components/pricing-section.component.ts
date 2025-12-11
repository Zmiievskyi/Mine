import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { NodesService } from '../../../core/services/nodes.service';
import { PublicPricing } from '../../../core/models/admin.model';
import { GPU_PRICING, GpuPricing } from '../../../core/constants/pricing.constants';

interface PricingItem {
  gpuType: string;
  pricePerHour: number | null;
  isContactSales: boolean;
  specs: GpuPricing | undefined;
}

@Component({
  selector: 'app-pricing-section',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollRevealDirective, DecimalPipe],
  templateUrl: './pricing-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingSectionComponent implements OnInit {
  private readonly nodesService = inject(NodesService);

  protected readonly pricing = signal<PricingItem[]>([]);
  protected readonly loading = signal(true);

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
}
