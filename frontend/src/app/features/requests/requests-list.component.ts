import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RequestsService } from '../../core/services/requests.service';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { NodeRequest, GPU_OPTIONS } from '../../core/models/request.model';
import { getRequestStatusVariant } from '../../shared/utils/request-status.util';
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
        <a routerLink="/nodes/request" hlmBtn>
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
          <button hlmBtn variant="destructive" (click)="loadRequests()" class="mt-4">
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
          <a routerLink="/nodes/request" hlmBtn>
            Request Your First Node
          </a>
        </div>
      }

      <!-- Requests Table -->
      @if (!loading() && !error() && requests().length > 0) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)]">
          <div hlmTableContainer>
            <table hlmTable>
              <thead hlmThead>
                <tr hlmTr>
                  <th hlmTh class="text-muted-foreground uppercase tracking-wider">GPU Type</th>
                  <th hlmTh class="text-muted-foreground uppercase tracking-wider">Quantity</th>
                  <th hlmTh class="text-muted-foreground uppercase tracking-wider">Region</th>
                  <th hlmTh class="text-muted-foreground uppercase tracking-wider">Status</th>
                  <th hlmTh class="text-muted-foreground uppercase tracking-wider">Submitted</th>
                  <th hlmTh class="text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody hlmTbody>
                @for (request of requests(); track request.id) {
                  <tr hlmTr>
                    <td hlmTd>
                      <span class="font-medium">{{ getGpuLabel(request.gpuType) }}</span>
                    </td>
                    <td hlmTd>{{ request.gpuCount }}</td>
                    <td hlmTd class="text-muted-foreground">{{ request.region || 'Any' }}</td>
                    <td hlmTd>
                      <span hlmBadge [variant]="getStatusVariant(request.status)">
                        {{ request.status }}
                      </span>
                    </td>
                    <td hlmTd class="text-muted-foreground">
                      {{ request.createdAt | date: 'MMM d, y' }}
                    </td>
                    <td hlmTd class="text-right">
                      @if (request.status === 'pending') {
                        <button
                          hlmBtn
                          variant="ghost"
                          size="sm"
                          class="text-destructive hover:text-destructive"
                          (click)="cancelRequest(request.id)"
                        >
                          Cancel
                        </button>
                      }
                      @if (request.adminNotes) {
                        <button
                          hlmBtn
                          variant="link"
                          size="sm"
                          (click)="showNotes(request)"
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

          <!-- Summary Footer -->
          <div class="px-6 py-4 bg-muted/50 border-t">
            <span class="text-sm text-muted-foreground">
              {{ requests().length }} request(s)
            </span>
          </div>
        </div>
      }

      <!-- Notes Modal -->
      <hlm-dialog [state]="selectedRequest() ? 'open' : 'closed'" (closed)="selectedRequest.set(null)">
        <hlm-dialog-content *brnDialogContent="let ctx" class="sm:max-w-md">
          <hlm-dialog-header>
            <h3 hlmDialogTitle>Admin Notes</h3>
          </hlm-dialog-header>
          <p class="py-4">{{ selectedRequest()?.adminNotes }}</p>
          <hlm-dialog-footer>
            <button hlmBtn variant="outline" (click)="selectedRequest.set(null)">Close</button>
          </hlm-dialog-footer>
        </hlm-dialog-content>
      </hlm-dialog>
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

  getStatusVariant = getRequestStatusVariant;

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
