import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUser, AssignNodeDto } from '../../../../core/models/admin.model';
import { GPU_OPTIONS } from '../../../../core/models/request.model';

@Component({
  selector: 'app-assign-node-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 p-6">
          <h3 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">
            Assign Node to {{ user?.name || user?.email }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--gcore-text)] mb-1">
                Node Address *
              </label>
              <input
                type="text"
                [(ngModel)]="formData.nodeAddress"
                placeholder="gonka1..."
                class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded-lg focus:ring-2 focus:ring-[var(--gcore-primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-[var(--gcore-text)] mb-1">
                Label
              </label>
              <input
                type="text"
                [(ngModel)]="formData.label"
                placeholder="e.g., Node-1"
                class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded-lg focus:ring-2 focus:ring-[var(--gcore-primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-[var(--gcore-text)] mb-1">
                GPU Type
              </label>
              <select
                [(ngModel)]="formData.gpuType"
                class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded-lg focus:ring-2 focus:ring-[var(--gcore-primary)] focus:border-transparent"
              >
                <option value="">Select GPU Type</option>
                @for (gpu of gpuOptions; track gpu.value) {
                  <option [value]="gpu.value">{{ gpu.label }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-[var(--gcore-text)] mb-1">
                Notes
              </label>
              <textarea
                [(ngModel)]="formData.notes"
                rows="2"
                placeholder="Optional notes..."
                class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded-lg focus:ring-2 focus:ring-[var(--gcore-primary)] focus:border-transparent"
              ></textarea>
            </div>
          </div>

          @if (error()) {
            <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {{ error() }}
            </div>
          }

          <div class="flex gap-3 mt-6">
            <button
              (click)="onAssign()"
              [disabled]="!isValid() || submitting()"
              class="flex-1 py-2 bg-[var(--gcore-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {{ submitting() ? 'Assigning...' : 'Assign Node' }}
            </button>
            <button
              (click)="onClose()"
              class="flex-1 py-2 border border-[var(--gcore-border)] rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    }
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
