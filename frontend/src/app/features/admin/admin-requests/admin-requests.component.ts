import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AdminRequest } from '../../../core/models/admin.model';
import { GPU_OPTIONS } from '../../../core/models/request.model';
import { getRequestStatusClass } from '../../../shared/utils/status-styles.util';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';

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
  imports: [CommonModule, FormsModule, RouterLink, LayoutComponent, LoadingSpinnerComponent, DatePipe, BrnDialogImports, HlmDialogImports, HlmButton],
  template: `
    <app-layout>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-[var(--gcore-text)]">Manage Requests</h1>
          <p class="text-[var(--gcore-text-muted)] mt-1">
            Review and process node provisioning requests
          </p>
        </div>
        <a
          routerLink="/admin"
          class="px-4 py-2 border border-[var(--gcore-border)] rounded-lg hover:bg-gray-50"
        >
          Back to Admin
        </a>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="text-2xl font-bold text-yellow-800">{{ stats().pending }}</div>
          <div class="text-sm text-yellow-600">Pending Requests</div>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="text-2xl font-bold text-blue-800">{{ stats().approved }}</div>
          <div class="text-sm text-blue-600">Approved Requests</div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="text-2xl font-bold text-green-800">{{ stats().completed }}</div>
          <div class="text-sm text-green-600">Completed Requests</div>
        </div>
      </div>

      <!-- Filter -->
      <div class="mb-4 flex gap-2">
        @for (status of statusFilters; track status) {
          <button
            (click)="filterStatus.set(status)"
            class="px-3 py-1 text-sm rounded-lg border transition-colors"
            [class]="filterStatus() === status
              ? 'bg-[var(--gcore-primary)] text-white border-[var(--gcore-primary)]'
              : 'border-[var(--gcore-border)] hover:bg-gray-50'"
          >
            {{ status === 'all' ? 'All' : status }}
          </button>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12">
          <app-loading-spinner message="Loading requests..." />
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <p class="text-red-600">{{ error() }}</p>
          <button
            (click)="loadRequests()"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      }

      <!-- Table -->
      @if (!loading() && !error() && filteredRequests().length > 0) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] overflow-hidden">
          <table class="min-w-full divide-y divide-[var(--gcore-border)]">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">GPU</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Qty</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Region</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Submitted</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--gcore-border)]">
              @for (request of filteredRequests(); track request.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-[var(--gcore-text)]">{{ request.user?.name || 'Unknown' }}</div>
                    <div class="text-sm text-[var(--gcore-text-muted)]">{{ request.user?.email }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap font-medium text-[var(--gcore-text)]">
                    {{ getGpuLabel(request.gpuType) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-[var(--gcore-text)]">
                    {{ request.gpuCount }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-[var(--gcore-text-muted)]">
                    {{ request.region || 'Any' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      [class]="getRequestStatusClass(request.status)"
                    >
                      {{ request.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--gcore-text-muted)]">
                    {{ request.createdAt | date: 'MMM d, y' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    @if (request.status === 'pending') {
                      <button
                        (click)="approveRequest(request)"
                        class="text-green-600 hover:text-green-800 text-sm mr-3"
                      >
                        Approve
                      </button>
                      <button
                        (click)="rejectRequest(request)"
                        class="text-red-600 hover:text-red-800 text-sm"
                      >
                        Reject
                      </button>
                    }
                    @if (request.status === 'approved') {
                      <button
                        (click)="completeRequest(request)"
                        class="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Mark Complete
                      </button>
                    }
                    <button
                      (click)="editNotes(request)"
                      class="text-[var(--gcore-text-muted)] hover:text-[var(--gcore-text)] text-sm ml-3"
                    >
                      Notes
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="mt-4 text-sm text-[var(--gcore-text-muted)]">
          Showing {{ filteredRequests().length }} of {{ requests().length }} request(s)
        </div>
      }

      @if (!loading() && !error() && filteredRequests().length === 0) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12 text-center">
          <p class="text-[var(--gcore-text-muted)]">No requests found</p>
        </div>
      }

      <!-- Notes Modal -->
      @if (editingRequest()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">Admin Notes</h3>
            <textarea
              [(ngModel)]="notesText"
              rows="4"
              class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded-lg focus:ring-2 focus:ring-[var(--gcore-primary)] focus:border-transparent"
              placeholder="Add notes for this request..."
            ></textarea>
            <div class="flex gap-3 mt-4">
              <button
                (click)="saveNotes()"
                class="flex-1 py-2 bg-[var(--gcore-primary)] text-white rounded-lg hover:opacity-90"
              >
                Save
              </button>
              <button
                (click)="editingRequest.set(null)"
                class="flex-1 py-2 border border-[var(--gcore-border)] rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Confirm Dialog -->
      <hlm-dialog [state]="confirmDialog() ? 'open' : 'closed'" (closed)="cancelConfirm()">
        <hlm-dialog-content *brnDialogContent="let ctx" class="sm:max-w-[400px]">
          <hlm-dialog-header>
            <h3 hlmDialogTitle>{{ confirmDialog()?.title }}</h3>
            <p hlmDialogDescription>{{ confirmDialog()?.message }}</p>
          </hlm-dialog-header>
          <hlm-dialog-footer>
            <button hlmBtn variant="outline" (click)="cancelConfirm()">Cancel</button>
            <button hlmBtn [variant]="confirmDialog()?.variant || 'default'" (click)="executeConfirm()">
              {{ confirmDialog()?.confirmText || 'Confirm' }}
            </button>
          </hlm-dialog-footer>
        </hlm-dialog-content>
      </hlm-dialog>
    </app-layout>
  `,
})
export class AdminRequestsComponent implements OnInit {
  private adminService = inject(AdminService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  requests = signal<AdminRequest[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  filterStatus = signal<string>('all');
  editingRequest = signal<AdminRequest | null>(null);
  notesText = '';
  stats = signal({ pending: 0, approved: 0, completed: 0 });
  confirmDialog = signal<ConfirmDialogData | null>(null);

  statusFilters = ['all', 'pending', 'approved', 'rejected', 'completed'];
  gpuOptions = GPU_OPTIONS;

  ngOnInit(): void {
    this.loadRequests();
    this.loadStats();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService
      .getAllRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => {
          this.requests.set(requests);
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

  filteredRequests(): AdminRequest[] {
    const status = this.filterStatus();
    if (status === 'all') return this.requests();
    return this.requests().filter((r) => r.status === status);
  }

  getGpuLabel(type: string): string {
    return this.gpuOptions.find((g) => g.value === type)?.label || type;
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
}
