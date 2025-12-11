import { Component, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignNodeModalComponent {
  // Inputs - public API for parent components
  public readonly user = input<AdminUser | null>(null);
  public readonly isOpen = input(false);
  public readonly errorMessage = input<string | null>(null);
  public readonly isSubmitting = input(false);

  // Outputs - public API for parent components
  public readonly close = output<void>();
  public readonly assign = output<AssignNodeDto>();

  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly gpuOptions = GPU_OPTIONS;

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

  public formData: AssignNodeDto = {
    nodeAddress: '',
    label: '',
    gpuType: '',
    notes: '',
  };

  protected isValid(): boolean {
    return !!this.formData.nodeAddress.trim();
  }

  protected onAssign(): void {
    if (!this.isValid()) return;
    this.assign.emit({ ...this.formData });
  }

  protected onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.formData = {
      nodeAddress: '',
      label: '',
      gpuType: '',
      notes: '',
    };
    this.error.set(null);
  }
}
