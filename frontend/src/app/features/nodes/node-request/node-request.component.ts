import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestsService } from '../../../core/services/requests.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import {
  GpuType,
  CreateRequestDto,
  GPU_OPTIONS,
  REGION_OPTIONS,
} from '../../../core/models/request.model';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';

@Component({
  selector: 'app-node-request',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    LayoutComponent,
    HlmButton,
    HlmInput,
    HlmLabel,
    BrnSelectImports,
    HlmSelectImports,
  ],
  template: `
    <app-layout>
      <div class="max-w-2xl">
        <!-- Header -->
        <div class="mb-6">
          <a
            routerLink="/nodes"
            class="text-sm text-[var(--gcore-text-muted)] hover:text-[var(--gcore-primary)] flex items-center gap-1 mb-4"
          >
            <span>&larr;</span> Back to Nodes
          </a>
          <h1 class="text-2xl font-bold text-[var(--gcore-text)]">Request New Node</h1>
          <p class="text-[var(--gcore-text-muted)] mt-1">
            Submit a request for new GPU nodes. Our team will process it within 24-48 hours.
          </p>
        </div>

        <!-- Success State -->
        @if (success()) {
          <div class="bg-green-50 border border-green-200 rounded-lg p-6">
            <div class="flex items-center gap-3">
              <span class="text-green-600 text-2xl">&#10003;</span>
              <div>
                <h3 class="font-medium text-green-800">Request Submitted Successfully!</h3>
                <p class="text-green-600 text-sm mt-1">
                  Your request has been submitted. Our team will review it shortly.
                </p>
              </div>
            </div>
            <div class="mt-4 flex gap-3">
              <a routerLink="/requests" hlmBtn size="sm">
                View My Requests
              </a>
              <button hlmBtn variant="outline" size="sm" (click)="resetForm()">
                Submit Another Request
              </button>
            </div>
          </div>
        } @else {
          <!-- Form -->
          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- GPU Type Selection -->
            <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
              <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">
                Select GPU Type
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (gpu of gpuOptions; track gpu.value) {
                  <label
                    class="relative flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors"
                    [class]="
                      formData.gpuType === gpu.value
                        ? 'border-[var(--gcore-primary)] bg-purple-50'
                        : 'border-[var(--gcore-border)] hover:border-gray-300'
                    "
                  >
                    <div class="flex items-center gap-3">
                      <input
                        type="radio"
                        name="gpuType"
                        [value]="gpu.value"
                        [(ngModel)]="formData.gpuType"
                        class="sr-only"
                      />
                      <div>
                        <p class="font-medium text-[var(--gcore-text)]">{{ gpu.label }}</p>
                        <p class="text-sm text-[var(--gcore-text-muted)]">{{ gpu.price }}</p>
                      </div>
                    </div>
                    @if (formData.gpuType === gpu.value) {
                      <span class="text-[var(--gcore-primary)]">&#10003;</span>
                    }
                  </label>
                }
              </div>
            </div>

            <!-- Quantity -->
            <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
              <label hlmLabel class="block">Number of GPUs</label>
              <div class="mt-2 flex items-center gap-4">
                <button
                  hlmBtn
                  variant="outline"
                  size="icon"
                  type="button"
                  (click)="decrementCount()"
                  [disabled]="formData.gpuCount <= 1"
                >
                  -
                </button>
                <input
                  hlmInput
                  type="number"
                  [(ngModel)]="formData.gpuCount"
                  name="gpuCount"
                  min="1"
                  max="10"
                  class="w-20 text-center text-lg font-semibold"
                />
                <button
                  hlmBtn
                  variant="outline"
                  size="icon"
                  type="button"
                  (click)="incrementCount()"
                  [disabled]="formData.gpuCount >= 10"
                >
                  +
                </button>
              </div>
              <p class="text-sm text-muted-foreground mt-2">
                Maximum 10 GPUs per request
              </p>
            </div>

            <!-- Region -->
            <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
              <label hlmLabel class="block mb-2">Preferred Region (Optional)</label>
              <brn-select [(ngModel)]="formData.region" name="region" placeholder="No preference">
                <hlm-select-trigger class="w-full">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content>
                  <hlm-option value="">No preference</hlm-option>
                  @for (region of regionOptions; track region.value) {
                    <hlm-option [value]="region.value">{{ region.label }}</hlm-option>
                  }
                </hlm-select-content>
              </brn-select>
            </div>

            <!-- Message -->
            <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
              <label hlmLabel class="block mb-2">Additional Notes (Optional)</label>
              <textarea
                hlmInput
                [(ngModel)]="formData.message"
                name="message"
                rows="3"
                placeholder="Any specific requirements or questions..."
                class="w-full min-h-[80px]"
              ></textarea>
            </div>

            <!-- Summary -->
            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="font-medium text-[var(--gcore-text)] mb-3">Request Summary</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-[var(--gcore-text-muted)]">GPU Type:</span>
                  <span class="text-[var(--gcore-text)] font-medium">
                    {{ getGpuLabel(formData.gpuType) }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[var(--gcore-text-muted)]">Quantity:</span>
                  <span class="text-[var(--gcore-text)] font-medium">
                    {{ formData.gpuCount }} GPU(s)
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[var(--gcore-text-muted)]">Region:</span>
                  <span class="text-[var(--gcore-text)] font-medium">
                    {{ getRegionLabel(formData.region) || 'No preference' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Error -->
            @if (error()) {
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-600 text-sm">{{ error() }}</p>
              </div>
            }

            <!-- Actions -->
            <div class="flex gap-4">
              <button
                hlmBtn
                type="submit"
                [disabled]="submitting() || !formData.gpuType"
                class="flex-1"
              >
                @if (submitting()) {
                  Submitting...
                } @else {
                  Submit Request
                }
              </button>
              <a routerLink="/nodes" hlmBtn variant="outline">
                Cancel
              </a>
            </div>
          </form>
        }
      </div>
    </app-layout>
  `,
})
export class NodeRequestComponent {
  gpuOptions = GPU_OPTIONS;
  regionOptions = REGION_OPTIONS;

  formData: CreateRequestDto = {
    gpuType: 'L40S',
    gpuCount: 1,
    region: '',
    message: '',
  };

  submitting = signal(false);
  success = signal(false);
  error = signal<string | null>(null);

  constructor(
    private requestsService: RequestsService,
    private router: Router
  ) {}

  incrementCount(): void {
    if (this.formData.gpuCount < 10) {
      this.formData.gpuCount++;
    }
  }

  decrementCount(): void {
    if (this.formData.gpuCount > 1) {
      this.formData.gpuCount--;
    }
  }

  getGpuLabel(type: GpuType): string {
    return this.gpuOptions.find((g) => g.value === type)?.label || type;
  }

  getRegionLabel(value: string | undefined): string {
    return this.regionOptions.find((r) => r.value === value)?.label || '';
  }

  onSubmit(): void {
    if (!this.formData.gpuType) {
      this.error.set('Please select a GPU type');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const request: CreateRequestDto = {
      gpuType: this.formData.gpuType,
      gpuCount: this.formData.gpuCount,
      region: this.formData.region || undefined,
      message: this.formData.message || undefined,
    };

    this.requestsService.create(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.message || 'Failed to submit request');
      },
    });
  }

  resetForm(): void {
    this.formData = {
      gpuType: 'L40S',
      gpuCount: 1,
      region: '',
      message: '',
    };
    this.success.set(false);
    this.error.set(null);
  }
}
