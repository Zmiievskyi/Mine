import { Component, signal, inject } from '@angular/core';
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
import { handleApiError } from '../../../shared/utils';
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
  templateUrl: './node-request.component.html',
})
export class NodeRequestComponent {
  private requestsService = inject(RequestsService);
  private router = inject(Router);

  gpuOptions = GPU_OPTIONS;
  regionOptions = REGION_OPTIONS;

  formData: CreateRequestDto = {
    gpuType: 'H100',
    gpuCount: 1,
    region: '',
    message: '',
  };

  submitting = signal(false);
  success = signal(false);
  error = signal<string | null>(null);

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
      error: (err) => handleApiError(err, 'Failed to submit request', this.error, this.submitting),
    });
  }

  resetForm(): void {
    this.formData = {
      gpuType: 'H100',
      gpuCount: 1,
      region: '',
      message: '',
    };
    this.success.set(false);
    this.error.set(null);
  }
}
