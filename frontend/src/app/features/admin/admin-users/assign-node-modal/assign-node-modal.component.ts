import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUser, AssignNodeDto } from '../../../../core/models/admin.model';
import { GPU_OPTIONS } from '../../../../core/models/request.model';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmLabel } from '@spartan-ng/helm/label';

@Component({
  selector: 'app-assign-node-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BrnDialogImports,
    HlmDialogImports,
    BrnSelectImports,
    HlmSelectImports,
    HlmButton,
    HlmInput,
    HlmTextarea,
    HlmLabel,
  ],
  template: `
    <hlm-dialog [state]="isOpen() ? 'open' : 'closed'" (closed)="onClose()">
      <hlm-dialog-content *brnDialogContent="let ctx" class="sm:max-w-lg">
        <hlm-dialog-header>
          <h3 hlmDialogTitle>Assign Node to {{ user()?.name || user()?.email }}</h3>
        </hlm-dialog-header>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label hlmLabel>Node Address *</label>
            <input
              hlmInput
              type="text"
              [(ngModel)]="formData.nodeAddress"
              placeholder="gonka1..."
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <label hlmLabel>Label</label>
            <input
              hlmInput
              type="text"
              [(ngModel)]="formData.label"
              placeholder="e.g., Node-1"
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <label hlmLabel>GPU Type</label>
            <brn-select [(ngModel)]="formData.gpuType" class="w-full">
              <hlm-select-trigger>
                <hlm-select-value placeholder="Select GPU Type" />
              </hlm-select-trigger>
              <hlm-select-content>
                <hlm-option value="">Select GPU Type</hlm-option>
                @for (gpu of gpuOptions; track gpu.value) {
                  <hlm-option [value]="gpu.value">{{ gpu.label }}</hlm-option>
                }
              </hlm-select-content>
            </brn-select>
          </div>

          <div class="space-y-2">
            <label hlmLabel>Notes</label>
            <textarea
              hlmTextarea
              [(ngModel)]="formData.notes"
              rows="2"
              placeholder="Optional notes..."
              class="w-full min-h-[60px]"
            ></textarea>
          </div>
        </div>

        @if (error()) {
          <div class="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm mb-4">
            {{ error() }}
          </div>
        }

        <hlm-dialog-footer>
          <button hlmBtn variant="outline" (click)="onClose()">Cancel</button>
          <button
            hlmBtn
            (click)="onAssign()"
            [disabled]="!isValid() || submitting()"
          >
            {{ submitting() ? 'Assigning...' : 'Assign Node' }}
          </button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class AssignNodeModalComponent {
  user = input<AdminUser | null>(null);
  isOpen = input(false);
  errorMessage = input<string | null>(null);
  isSubmitting = input(false);

  close = output<void>();
  assign = output<AssignNodeDto>();

  error = signal<string | null>(null);
  submitting = signal(false);
  gpuOptions = GPU_OPTIONS;

  constructor() {
    // Sync external errorMessage to internal error signal
    effect(() => {
      this.error.set(this.errorMessage());
    });
    // Sync external isSubmitting to internal submitting signal
    effect(() => {
      this.submitting.set(this.isSubmitting());
    });
  }

  formData: AssignNodeDto = {
    nodeAddress: '',
    label: '',
    gpuType: '',
    notes: '',
  };

  isValid(): boolean {
    return !!this.formData.nodeAddress.trim();
  }

  onAssign(): void {
    if (!this.isValid()) return;
    this.assign.emit({ ...this.formData });
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  resetForm(): void {
    this.formData = {
      nodeAddress: '',
      label: '',
      gpuType: '',
      notes: '',
    };
    this.error.set(null);
  }
}
