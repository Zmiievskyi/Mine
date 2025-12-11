import { Component, OnInit, signal, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AdminRequest, AdminRequestsQuery } from '../../../core/models/admin.model';
import { GPU_OPTIONS } from '../../../core/models/request.model';
import { getGpuLabel } from '../../../core/constants/pricing.constants';
import {
  createDebounce,
  downloadBlobWithDate,
  getRequestStatusVariant,
  handleApiError,
  extractErrorMessage,
} from '../../../shared/utils';
import { DEBOUNCE_DELAYS } from '../../../core/constants';
import { ConfirmDialogData } from '../../../shared/models/confirm-dialog.model';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LayoutComponent,
    LoadingSpinnerComponent,
    DatePipe,
    BrnDialogImports,
    HlmDialogImports,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmTextarea,
    BrnSelectImports,
    HlmSelectImports,
    HlmCardImports,
    HlmTableImports,
    HlmBadge,
  ],
  templateUrl: './admin-requests.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRequestsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly Math = Math;

  protected readonly requests = signal<AdminRequest[]>([]);
  protected readonly meta = signal<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly editingRequest = signal<AdminRequest | null>(null);
  public notesText = '';
  protected readonly stats = signal({ pending: 0, approved: 0, completed: 0 });
  protected readonly exporting = signal(false);
  protected readonly confirmDialog = signal<ConfirmDialogData | null>(null);
  private pendingAction: (() => void) | null = null;

  // Filter state
  public statusFilter: 'pending' | 'approved' | 'rejected' | 'completed' | 'all' = 'all';
  public gpuFilter = '';
  public userEmailFilter = '';
  public dateFrom = '';
  public dateTo = '';
  public currentPage = 1;

  protected readonly gpuOptions = GPU_OPTIONS;
  protected readonly getRequestStatusVariant = getRequestStatusVariant;
  protected readonly getGpuLabel = getGpuLabel;

  private readonly searchDebounce = createDebounce();

  public ngOnInit(): void {
    this.loadRequests();
    this.loadStats();
  }

  protected loadRequests(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: AdminRequestsQuery = {
      page: this.currentPage,
      limit: 20,
      status: this.statusFilter,
      gpuType: this.gpuFilter || undefined,
      userEmail: this.userEmailFilter || undefined,
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo || undefined,
      sortOrder: 'desc',
    };

    this.adminService
      .getAllRequests(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.requests.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: (err) => handleApiError(err, 'Failed to load requests', this.error, this.loading),
      });
  }

  private loadStats(): void {
    this.adminService
      .getRequestStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => {},
      });
  }

  protected onFilterChange(): void {
    this.searchDebounce(() => {
      this.currentPage = 1;
      this.loadRequests();
    }, DEBOUNCE_DELAYS.SEARCH);
  }

  protected goToPage(page: number): void {
    this.currentPage = page;
    this.loadRequests();
  }

  protected approveRequest(request: AdminRequest): void {
    this.updateStatus(request.id, 'approved');
  }

  protected rejectRequest(request: AdminRequest): void {
    this.confirmDialog.set({
      title: 'Reject Request',
      message: 'Are you sure you want to reject this request?',
      confirmText: 'Reject',
      variant: 'destructive',
    });
    this.pendingAction = () => this.updateStatus(request.id, 'rejected');
  }

  protected completeRequest(request: AdminRequest): void {
    this.updateStatus(request.id, 'completed');
  }

  private updateStatus(id: string, status: RequestStatus): void {
    this.adminService
      .updateRequest(id, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notification.success(`Request ${status} successfully`);
          this.loadRequests();
          this.loadStats();
        },
        error: (err) => this.notification.error(extractErrorMessage(err, 'Failed to update request')),
      });
  }

  protected editNotes(request: AdminRequest): void {
    this.notesText = request.adminNotes || '';
    this.editingRequest.set(request);
  }

  protected closeNotesDialog(): void {
    this.editingRequest.set(null);
  }

  protected saveNotes(): void {
    const request = this.editingRequest();
    if (!request) return;

    this.adminService
      .updateRequest(request.id, { adminNotes: this.notesText })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notification.success('Notes saved');
          this.editingRequest.set(null);
          this.loadRequests();
        },
        error: (err) => this.notification.error(extractErrorMessage(err, 'Failed to save notes')),
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

  protected exportToCsv(): void {
    this.exporting.set(true);
    this.adminService.exportRequests().subscribe({
      next: (blob) => {
        downloadBlobWithDate(blob, 'requests');
        this.exporting.set(false);
      },
      error: () => {
        this.notification.error('Failed to export requests');
        this.exporting.set(false);
      },
    });
  }
}
