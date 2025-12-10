import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RequestsService } from '../../core/services/requests.service';
import { NotificationService } from '../../core/services/notification.service';
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
})
export class RequestsListComponent implements OnInit {
  requests = signal<NodeRequest[]>([]);
  private requestsService = inject(RequestsService);
  private notification = inject(NotificationService);

  loading = signal(true);
  error = signal<string | null>(null);
  selectedRequest = signal<NodeRequest | null>(null);
  confirmDialog = signal<ConfirmDialogData | null>(null);
  private pendingAction: (() => void) | null = null;

  gpuOptions = GPU_OPTIONS;
  getGpuLabel = getGpuLabel;

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
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

  getStatusVariant = getRequestStatusVariant;

  confirmCancelRequest(id: string): void {
    this.confirmDialog.set({
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel this request? This action cannot be undone.',
      confirmText: 'Cancel Request',
      variant: 'destructive',
    });
    this.pendingAction = () => this.cancelRequest(id);
  }

  cancelRequest(id: string): void {
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

  cancelConfirm(): void {
    this.confirmDialog.set(null);
    this.pendingAction = null;
  }

  executeConfirm(): void {
    if (this.pendingAction) {
      this.pendingAction();
      this.confirmDialog.set(null);
      this.pendingAction = null;
    }
  }

  showNotes(request: NodeRequest): void {
    this.selectedRequest.set(request);
  }
}
