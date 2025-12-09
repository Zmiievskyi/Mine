import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUser, AssignNodeDto } from '../../../../core/models/admin.model';
import { GPU_OPTIONS } from '../../../../core/models/request.model';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';

@Component({
  selector: 'app-assign-node-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BrnDialogImports,
    HlmDialogImports,
    HlmButton,
    HlmInput,
    HlmLabel,
  ],
  template: `
    <hlm-dialog [state]="isOpen ? 'open' : 'closed'" (closed)="onClose()">
      <hlm-dialog-content class="sm:max-w-lg">
        <hlm-dialog-header>
          <h3 hlmDialogTitle>Assign Node to {{ user?.name || user?.email }}</h3>
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
            <select
              [(ngModel)]="formData.gpuType"
              class="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select GPU Type</option>
              @for (gpu of gpuOptions; track gpu.value) {
                <option [value]="gpu.value">{{ gpu.label }}</option>
              }
            </select>
          </div>

          <div class="space-y-2">
            <label hlmLabel>Notes</label>
            <textarea
              hlmInput
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
  @Input() user: AdminUser | null = null;
  @Input() isOpen = false;
  @Input() set errorMessage(value: string | null) {
    this.error.set(value);
  }
  @Input() set isSubmitting(value: boolean) {
    this.submitting.set(value);
  }

  @Output() close = new EventEmitter<void>();
  @Output() assign = new EventEmitter<AssignNodeDto>();

  error = signal<string | null>(null);
  submitting = signal(false);
  gpuOptions = GPU_OPTIONS;

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
