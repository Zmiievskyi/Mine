import { Component, input, output } from '@angular/core';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import {
  HlmDialogImports,
  HlmDialogComponent,
} from '@spartan-ng/helm/dialog';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { ConfirmDialogData } from '../../models/confirm-dialog.model';

/**
 * Reusable confirmation dialog component using Spartan UI
 *
 * Usage:
 * ```typescript
 * confirmData = signal<ConfirmDialogData | null>(null);
 *
 * showConfirm() {
 *   this.confirmData.set({
 *     title: 'Delete User',
 *     message: 'Are you sure you want to delete this user?',
 *     confirmText: 'Delete',
 *     variant: 'destructive'
 *   });
 * }
 *
 * onConfirmed() {
 *   // Handle confirmation
 *   this.confirmData.set(null);
 * }
 * ```
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [BrnDialogImports, HlmDialogImports, HlmButtonDirective],
  template: `
    <hlm-dialog [state]="data() ? 'open' : 'closed'" (closed)="onCancel()">
      <hlm-dialog-content *brnDialogContent="let ctx" class="sm:max-w-[400px]">
        <hlm-dialog-header>
          <h3 hlmDialogTitle>{{ data()?.title }}</h3>
          <p hlmDialogDescription>{{ data()?.message }}</p>
        </hlm-dialog-header>
        <hlm-dialog-footer>
          <button hlmBtn variant="outline" (click)="onCancel()">
            {{ data()?.cancelText || 'Cancel' }}
          </button>
          <button
            hlmBtn
            [variant]="data()?.variant || 'default'"
            (click)="onConfirm()"
          >
            {{ data()?.confirmText || 'Confirm' }}
          </button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class ConfirmDialogComponent {
  // Dialog data - when not null, dialog opens
  data = input<ConfirmDialogData | null>(null);

  // Emitted when user confirms action
  confirmed = output<void>();

  // Emitted when user cancels or closes dialog
  cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
