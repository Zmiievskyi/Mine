import { Component, OnInit, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { RequestsService } from '../../core/services/requests.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { NodeRequest, GPU_OPTIONS } from '../../core/models/request.model';
import { getGpuLabel } from '../../core/constants/pricing.constants';
import { getRequestStatusVariant, handleApiError, extractErrorMessage } from '../../shared/utils';
import { ConfirmDialogData } from '../../shared/models/confirm-dialog.model';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

@Component({
  selector: 'app-requests-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LayoutComponent,
    LoadingSpinnerComponent,
    DatePipe,
    HlmTableImports,
    HlmBadge,
    HlmButton,
    BrnDialogImports,
    HlmDialogImports,
  ],
  templateUrl: './requests-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsListComponent implements OnInit {
  private readonly requestsService = inject(RequestsService);
  private readonly notification = inject(NotificationService);
  private readonly authService = inject(AuthService);

  protected readonly requests = signal<NodeRequest[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedRequest = signal<NodeRequest | null>(null);
  protected readonly confirmDialog = signal<ConfirmDialogData | null>(null);
  private pendingAction: (() => void) | null = null;

  protected readonly currentUser = toSignal(this.authService.currentUser$);

  // Check if user can request nodes (email verified for local auth users)
  protected readonly canRequestNodes = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    // OAuth users can always request
    if (user.provider !== 'local') return true;
    // Local auth users need verified email
    return user.emailVerified === true;
  });

  protected readonly gpuOptions = GPU_OPTIONS;
  protected readonly getGpuLabel = getGpuLabel;

  public ngOnInit(): void {
    this.loadRequests();
  }

  protected loadRequests(): void {
    this.loading.set(true);
    this.error.set(null);

    this.requestsService.getMyRequests().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: (err) => handleApiError(err, 'Failed to load requests', this.error, this.loading),
    });
  }

  protected readonly getStatusVariant = getRequestStatusVariant;

  protected confirmCancelRequest(id: string): void {
    this.confirmDialog.set({
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel this request? This action cannot be undone.',
      confirmText: 'Cancel Request',
      variant: 'destructive',
    });
    this.pendingAction = () => this.cancelRequest(id);
  }

  private cancelRequest(id: string): void {
    this.requestsService.cancelRequest(id).subscribe({
      next: () => {
        this.notification.success('Request cancelled successfully');
        this.loadRequests();
      },
      error: (err) => {
        this.notification.error(extractErrorMessage(err, 'Failed to cancel request'));
      },
    });
  }

  protected cancelConfirm(): void {
    this.confirmDialog.set(null);
    this.pendingAction = null;
  }

  protected executeConfirm(): void {
    if (this.pendingAction) {
      this.pendingAction();
      this.confirmDialog.set(null);
      this.pendingAction = null;
    }
  }

  protected showNotes(request: NodeRequest): void {
    this.selectedRequest.set(request);
  }
}
