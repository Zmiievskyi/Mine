import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RequestsService } from '../../core/services/requests.service';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { NodeRequest, GPU_OPTIONS, RequestStatus } from '../../core/models/request.model';
import { getRequestStatusClass } from '../../shared/utils/status-styles.util';

@Component({
  selector: 'app-requests-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LayoutComponent, LoadingSpinnerComponent, DatePipe],
  template: `
    <app-layout>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-[var(--gcore-text)]">My Requests</h1>
          <p class="text-[var(--gcore-text-muted)] mt-1">
            Track the status of your node provisioning requests
          </p>
        </div>
        <a
          routerLink="/nodes/request"
          class="px-4 py-2 bg-[var(--gcore-primary)] text-white rounded-lg hover:opacity-90"
        >
          + New Request
        </a>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12">
          <app-loading-spinner message="Loading requests..." />
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <div class="flex items-center gap-3">
            <span class="text-red-600 text-xl">!</span>
            <div>
              <h3 class="font-medium text-red-800">Failed to load requests</h3>
              <p class="text-red-600 text-sm">{{ error() }}</p>
            </div>
          </div>
          <button
            (click)="loadRequests()"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && requests().length === 0) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12 text-center">
          <div class="text-4xl mb-4 opacity-50">&#128221;</div>
          <h3 class="text-lg font-medium text-[var(--gcore-text)] mb-2">
            No Requests Yet
          </h3>
          <p class="text-[var(--gcore-text-muted)] mb-6 max-w-md mx-auto">
            You haven't submitted any node requests yet. Request new GPU nodes to get started.
          </p>
          <a
            routerLink="/nodes/request"
            class="inline-block px-6 py-2 bg-[var(--gcore-primary)] text-white rounded-lg hover:opacity-90"
          >
            Request Your First Node
          </a>
        </div>
      }

      <!-- Requests Table -->
      @if (!loading() && !error() && requests().length > 0) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] overflow-hidden">
          <table class="min-w-full divide-y divide-[var(--gcore-border)]">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                  GPU Type
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                  Quantity
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                  Region
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                  Submitted
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--gcore-border)]">
              @for (request of requests(); track request.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-medium text-[var(--gcore-text)]">
                      {{ getGpuLabel(request.gpuType) }}
                    </span>
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
                        (click)="cancelRequest(request.id)"
                        class="text-red-600 hover:text-red-800 text-sm"
                      >
                        Cancel
                      </button>
                    }
                    @if (request.adminNotes) {
                      <button
                        (click)="showNotes(request)"
                        class="text-[var(--gcore-primary)] hover:underline text-sm ml-3"
                      >
                        View Notes
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Request Count -->
        <div class="mt-4 text-sm text-[var(--gcore-text-muted)]">
          Showing {{ requests().length }} request(s)
        </div>
      }

      <!-- Notes Modal -->
      @if (selectedRequest()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-[var(--gcore-text)]">Admin Notes</h3>
              <button
                (click)="selectedRequest.set(null)"
                class="text-gray-400 hover:text-gray-600"
              >
                &#10005;
              </button>
            </div>
            <p class="text-[var(--gcore-text)]">{{ selectedRequest()?.adminNotes }}</p>
            <button
              (click)="selectedRequest.set(null)"
              class="mt-4 w-full py-2 border border-[var(--gcore-border)] rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      }
    </app-layout>
  `,
})
export class RequestsListComponent implements OnInit {
  requests = signal<NodeRequest[]>([]);
  private requestsService = inject(RequestsService);

  loading = signal(true);
  error = signal<string | null>(null);
  selectedRequest = signal<NodeRequest | null>(null);

  gpuOptions = GPU_OPTIONS;

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
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load requests');
        this.loading.set(false);
      },
    });
  }

  getGpuLabel(type: string): string {
    return this.gpuOptions.find((g) => g.value === type)?.label || type;
  }

  getRequestStatusClass = getRequestStatusClass;

  cancelRequest(id: string): void {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    this.requestsService.cancelRequest(id).subscribe({
      next: () => {
        this.loadRequests();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to cancel request');
      },
    });
  }

  showNotes(request: NodeRequest): void {
    this.selectedRequest.set(request);
  }
}
