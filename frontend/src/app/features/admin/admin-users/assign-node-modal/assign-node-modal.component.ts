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
  templateUrl: './assign-node-modal.component.html',
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
