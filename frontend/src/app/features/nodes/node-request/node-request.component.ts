import { Component, signal, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestsService } from '../../../core/services/requests.service';
import { NodesService } from '../../../core/services/nodes.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { GpuType, CreateRequestDto } from '../../../core/models/request.model';
import { GPU_PRICING, CURRENCY } from '../../../core/constants/pricing.constants';
import { handleApiError } from '../../../shared/utils';
import { HlmButton } from '@spartan-ng/helm/button';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface GpuOption {
  value: string;
  label: string;
  price: string;
}

@Component({
  selector: 'app-node-request',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    LayoutComponent,
    HlmButton,
    LoadingSpinnerComponent,
  ],
  templateUrl: './node-request.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeRequestComponent implements OnInit {
  private readonly requestsService = inject(RequestsService);
  private readonly nodesService = inject(NodesService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly gpuOptions = signal<GpuOption[]>([]);
  protected readonly selectedGpuType = signal<GpuType>('H100');
  protected readonly message = signal('');

  protected readonly submitting = signal(false);
  protected readonly success = signal(false);
  protected readonly error = signal<string | null>(null);

  public ngOnInit(): void {
    this.loadPricing();
  }

  private loadPricing(): void {
    this.nodesService.getPublicPricing().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const options = data
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((item) => ({
              value: item.gpuType,
              label: item.gpuType,
              price: this.formatPrice(item.pricePerHour, item.isContactSales),
            }));
          this.gpuOptions.set(options);
          // Set default to first available option
          if (options.length > 0) {
            this.selectedGpuType.set(options[0].value as GpuType);
          }
        } else {
          this.loadFallbackPricing();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadFallbackPricing();
        this.loading.set(false);
      },
    });
  }

  private loadFallbackPricing(): void {
    const fallback = GPU_PRICING.filter((gpu) => gpu.available).map((gpu) => ({
      value: gpu.id,
      label: gpu.name,
      price: gpu.pricePerHour ? `${CURRENCY}${gpu.pricePerHour.toFixed(2)}/hr` : 'Contact Sales',
    }));
    this.gpuOptions.set(fallback);
  }

  private formatPrice(pricePerHour: number | null, isContactSales: boolean): string {
    if (isContactSales || pricePerHour === null) {
      return 'Contact Sales';
    }
    return `${CURRENCY}${pricePerHour.toFixed(2)}/hr`;
  }

  protected selectGpu(gpuType: string): void {
    this.selectedGpuType.set(gpuType as GpuType);
  }

  protected onSubmit(): void {
    if (!this.selectedGpuType()) {
      this.error.set('Please select a GPU type');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const request: CreateRequestDto = {
      gpuType: this.selectedGpuType(),
      gpuCount: 1,
      message: this.message() || undefined,
    };

    this.requestsService.create(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
      },
      error: (err) => handleApiError(err, 'Failed to submit request', this.error, this.submitting),
    });
  }

  protected resetForm(): void {
    const options = this.gpuOptions();
    this.selectedGpuType.set(options.length > 0 ? (options[0].value as GpuType) : 'H100');
    this.message.set('');
    this.success.set(false);
    this.error.set(null);
  }
}
