import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
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
import { getRequestStatusClass } from '../../../shared/utils/status-styles.util';
import { createDebounce } from '../../../shared/utils/debounce.util';
import { downloadBlobWithDate } from '../../../shared/utils/download.util';
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

interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
}

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
})
export class AdminRequestsComponent implements OnInit {
  private adminService = inject(AdminService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  protected Math = Math;

  requests = signal<AdminRequest[]>([]);
  meta = signal<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  editingRequest = signal<AdminRequest | null>(null);
  notesText = '';
  stats = signal({ pending: 0, approved: 0, completed: 0 });
  exporting = signal(false);
  confirmDialog = signal<ConfirmDialogData | null>(null);

  // Filter state
  statusFilter: 'pending' | 'approved' | 'rejected' | 'completed' | 'all' = 'all';
  gpuFilter = '';
  userEmailFilter = '';
  dateFrom = '';
  dateTo = '';
  currentPage = 1;

  gpuOptions = GPU_OPTIONS;

  private searchDebounce = createDebounce();

  ngOnInit(): void {
    this.loadRequests();
    this.loadStats();
  }

  loadRequests(): void {
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
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load requests');
          this.loading.set(false);
        },
      });
  }

  loadStats(): void {
    this.adminService
      .getRequestStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => {},
      });
  }

  onFilterChange(): void {
    this.searchDebounce(() => {
      this.currentPage = 1;
      this.loadRequests();
    }, 300);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadRequests();
  }

  getGpuLabel(type: string): string {
    return this.gpuOptions.find((g) => g.value === type)?.label || type;
  }

  getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'outline';
    }
  }

  getRequestStatusClass = getRequestStatusClass;

  approveRequest(request: AdminRequest): void {
    this.updateStatus(request.id, 'approved');
  }

  rejectRequest(request: AdminRequest): void {
    this.confirmDialog.set({
      title: 'Reject Request',
      message: 'Are you sure you want to reject this request?',
      confirmText: 'Reject',
      variant: 'destructive',
      onConfirm: () => this.updateStatus(request.id, 'rejected'),
    });
  }

  completeRequest(request: AdminRequest): void {
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
        error: (err) => this.notification.error(err.error?.message || 'Failed to update request'),
      });
  }

  editNotes(request: AdminRequest): void {
    this.notesText = request.adminNotes || '';
    this.editingRequest.set(request);
  }

  closeNotesDialog(): void {
    this.editingRequest.set(null);
  }

  saveNotes(): void {
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
        error: (err) => this.notification.error(err.error?.message || 'Failed to save notes'),
      });
  }

  cancelConfirm(): void {
    this.confirmDialog.set(null);
  }

  executeConfirm(): void {
    const dialog = this.confirmDialog();
    if (dialog) {
      dialog.onConfirm();
      this.confirmDialog.set(null);
    }
  }

  exportToCsv(): void {
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
