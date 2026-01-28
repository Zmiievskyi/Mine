import { Component, DestroyRef, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PricingConfig, UpdatePricingDto } from '../../../core/models/admin.model';
import { handleApiError, extractErrorMessage } from '../../../shared/utils';
import {
  MIN_HOURLY_PRICE_USD,
  MAX_HOURLY_PRICE_USD,
  CURRENCY,
} from '../../../core/constants/pricing.constants';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-admin-pricing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DecimalPipe,
    LayoutComponent,
    LoadingSpinnerComponent,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmCardImports,
  ],
  templateUrl: './admin-pricing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPricingComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pricingConfigs = signal<PricingConfig[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal<string | null>(null);

  protected readonly editingGpu = signal<string | null>(null);
  protected readonly editForm = signal<{ pricePerHour: string; isContactSales: boolean }>({
    pricePerHour: '',
    isContactSales: false,
  });

  public ngOnInit(): void {
    this.loadPricing();
  }

  protected loadPricing(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService
      .getPricing()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (configs) => {
          this.pricingConfigs.set(configs);
          this.loading.set(false);
        },
        error: (err) => handleApiError(err, 'Failed to load pricing', this.error, this.loading),
      });
  }

  protected startEdit(config: PricingConfig): void {
    this.editingGpu.set(config.gpuType);
    this.editForm.set({
      pricePerHour: config.pricePerHour?.toString() ?? '',
      isContactSales: config.isContactSales,
    });
  }

  protected cancelEdit(): void {
    this.editingGpu.set(null);
  }

  protected onContactSalesChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.editForm.update((form) => ({ ...form, isContactSales: checked }));
  }

  protected onPriceChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.editForm.update((form) => ({ ...form, pricePerHour: value }));
  }

  protected savePrice(gpuType: string): void {
    const form = this.editForm();
    const dto: UpdatePricingDto = {
      isContactSales: form.isContactSales,
    };

    if (!form.isContactSales && form.pricePerHour) {
      const price = parseFloat(form.pricePerHour);
      if (isNaN(price) || price < MIN_HOURLY_PRICE_USD || price > MAX_HOURLY_PRICE_USD) {
        this.notification.error(`Price must be between ${MIN_HOURLY_PRICE_USD} and ${MAX_HOURLY_PRICE_USD}`);
        return;
      }
      dto.pricePerHour = price;
    } else if (form.isContactSales) {
      dto.pricePerHour = null;
    }

    this.saving.set(gpuType);

    this.adminService
      .updatePricing(gpuType, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notification.success(`${gpuType} pricing updated`);
          this.editingGpu.set(null);
          this.saving.set(null);
          this.loadPricing();
        },
        error: (err) => {
          this.notification.error(extractErrorMessage(err, 'Failed to update pricing'));
          this.saving.set(null);
        },
      });
  }

  protected formatPrice(config: PricingConfig): string {
    if (config.isContactSales || config.pricePerHour === null) {
      return 'Contact Sales';
    }
    return `${CURRENCY}${config.pricePerHour.toFixed(2)}/hr`;
  }
}
