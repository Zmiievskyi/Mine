import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NodesService } from '../../../core/services/nodes.service';
import { NodeDetail } from '../../../core/models/node.model';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';

type TabType = 'overview' | 'metrics' | 'history';

@Component({
  selector: 'app-node-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LayoutComponent],
  template: `
    <app-layout>
      <!-- Back Link & Header -->
      <div class="mb-6">
        <a
          routerLink="/nodes"
          class="text-sm text-[var(--gcore-text-muted)] hover:text-[var(--gcore-primary)] flex items-center gap-1 mb-4"
        >
          <span>&larr;</span> Back to Nodes
        </a>

        @if (loading()) {
          <div class="animate-pulse">
            <div class="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        } @else if (node()) {
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-2xl font-bold text-[var(--gcore-text)]">
                {{ node()?.alias || 'Node ' + node()?.address?.slice(0, 8) }}
              </h1>
              <p class="text-[var(--gcore-text-muted)] font-mono text-sm mt-1">
                {{ node()?.address }}
              </p>
            </div>
            <span
              class="px-3 py-1 rounded-full text-sm font-medium"
              [class]="getStatusClass(node()?.status || 'offline')"
            >
              {{ node()?.status }}
            </span>
          </div>
        }
      </div>

      <!-- Error State -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <div class="flex items-center gap-3">
            <span class="text-red-600 text-xl">!</span>
            <div>
              <h3 class="font-medium text-red-800">Failed to load node</h3>
              <p class="text-red-600 text-sm">{{ error() }}</p>
            </div>
          </div>
          <button
            (click)="loadNode()"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12">
          <div class="flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gcore-primary)] mb-4"></div>
            <p class="text-[var(--gcore-text-muted)]">Loading node details...</p>
          </div>
        </div>
      }

      <!-- Content -->
      @if (!loading() && !error() && node()) {
        <!-- Tabs -->
        <div class="border-b border-[var(--gcore-border)] mb-6">
          <nav class="flex gap-8">
            @for (tab of tabs; track tab.id) {
              <button
                (click)="activeTab.set(tab.id)"
                class="py-3 text-sm font-medium border-b-2 transition-colors"
                [class]="activeTab() === tab.id
                  ? 'border-[var(--gcore-primary)] text-[var(--gcore-primary)]'
                  : 'border-transparent text-[var(--gcore-text-muted)] hover:text-[var(--gcore-text)]'"
              >
                {{ tab.label }}
              </button>
            }
          </nav>
        </div>

        <!-- Overview Tab -->
        @if (activeTab() === 'overview') {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Info Card -->
            <div class="lg:col-span-2 bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
              <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">Node Information</h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-[var(--gcore-text-muted)]">GPU Type</p>
                  <p class="text-[var(--gcore-text)] font-medium">{{ node()?.gpuType }}</p>
                </div>
                <div>
                  <p class="text-sm text-[var(--gcore-text-muted)]">Status</p>
                  <p class="font-medium" [class]="getStatusTextClass(node()?.status || 'offline')">
                    {{ node()?.status }}
                    @if (node()?.isJailed) {
                      <span class="text-red-600">(Jailed)</span>
                    }
                    @if (node()?.isBlacklisted) {
                      <span class="text-red-600">(Blacklisted)</span>
                    }
                  </p>
                </div>
                <div>
                  <p class="text-sm text-[var(--gcore-text-muted)]">Network Weight</p>
                  <p class="text-[var(--gcore-text)] font-medium">{{ node()?.weight?.toFixed(4) || '0.0000' }}</p>
                </div>
                <div>
                  <p class="text-sm text-[var(--gcore-text-muted)]">Blocks Claimed</p>
                  <p class="text-[var(--gcore-text)] font-medium">{{ node()?.blocksClaimed || 0 }}</p>
                </div>
              </div>

              <!-- Models Section -->
              <div class="mt-6 pt-6 border-t border-[var(--gcore-border)]">
                <h3 class="text-sm font-medium text-[var(--gcore-text)] mb-3">Active Models</h3>
                @if (node()?.models && node()!.models.length > 0) {
                  <div class="flex flex-wrap gap-2">
                    @for (model of node()?.models; track model) {
                      <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {{ model }}
                      </span>
                    }
                  </div>
                } @else {
                  <p class="text-[var(--gcore-text-muted)] text-sm">No models active</p>
                }
              </div>
            </div>

            <!-- Earnings Card -->
            <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
              <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">Earnings</h2>
              <div class="text-center py-4">
                <p class="text-4xl font-bold text-[var(--gcore-primary)]">
                  {{ node()?.earnedCoins?.toFixed(2) || '0.00' }}
                </p>
                <p class="text-[var(--gcore-text-muted)] mt-1">GNK Earned</p>
              </div>
              <div class="mt-4 pt-4 border-t border-[var(--gcore-border)]">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-[var(--gcore-text-muted)]">Performance</span>
                  <span class="font-medium text-[var(--gcore-text)]">
                    {{ node()?.tokensPerSecond?.toFixed(2) || '0.00' }} tok/s
                  </span>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Metrics Tab -->
        @if (activeTab() === 'metrics') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
              <p class="text-sm text-[var(--gcore-text-muted)]">Inference Count</p>
              <p class="text-2xl font-bold text-[var(--gcore-text)]">
                {{ node()?.inferenceCount?.toLocaleString() || 0 }}
              </p>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
              <p class="text-sm text-[var(--gcore-text-muted)]">Missed Jobs</p>
              <p class="text-2xl font-bold text-[var(--gcore-text)]">
                {{ node()?.missedCount || 0 }}
              </p>
              <p class="text-sm text-[var(--gcore-text-muted)]">
                {{ (node()?.missedRate || 0).toFixed(2) }}% rate
              </p>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
              <p class="text-sm text-[var(--gcore-text-muted)]">Invalidation Rate</p>
              <p class="text-2xl font-bold text-[var(--gcore-text)]">
                {{ (node()?.invalidationRate || 0).toFixed(2) }}%
              </p>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
              <p class="text-sm text-[var(--gcore-text-muted)]">Uptime</p>
              <p class="text-2xl font-bold text-[var(--gcore-text)]">
                {{ node()?.uptimePercent?.toFixed(0) || 0 }}%
              </p>
            </div>
          </div>

          <!-- Performance Details -->
          <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
            <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">Performance Details</h2>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-[var(--gcore-text-muted)]">Inference Rate</span>
                  <span class="text-[var(--gcore-text)]">{{ node()?.tokensPerSecond?.toFixed(2) || 0 }} tok/s</span>
                </div>
                <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-[var(--gcore-primary)] rounded-full"
                    [style.width.%]="Math.min((node()?.tokensPerSecond || 0) * 10, 100)"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-[var(--gcore-text-muted)]">Success Rate</span>
                  <span class="text-[var(--gcore-text)]">{{ (100 - (node()?.missedRate || 0)).toFixed(1) }}%</span>
                </div>
                <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-green-500 rounded-full"
                    [style.width.%]="100 - (node()?.missedRate || 0)"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-[var(--gcore-text-muted)]">Network Weight</span>
                  <span class="text-[var(--gcore-text)]">{{ (node()?.weight || 0).toFixed(6) }}</span>
                </div>
                <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-500 rounded-full"
                    [style.width.%]="Math.min((node()?.weight || 0) * 10000, 100)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- History Tab -->
        @if (activeTab() === 'history') {
          <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12 text-center">
            <div class="text-4xl mb-4 opacity-50">&#128200;</div>
            <h3 class="text-lg font-medium text-[var(--gcore-text)] mb-2">
              Earnings History Coming Soon
            </h3>
            <p class="text-[var(--gcore-text-muted)] max-w-md mx-auto">
              Historical earnings data and status timeline will be available in a future update.
            </p>
          </div>
        }

        <!-- Quick Actions -->
        <div class="mt-6 flex gap-4">
          @if (node()?.inferenceUrl) {
            <a
              [href]="node()?.inferenceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 border border-[var(--gcore-border)] text-[var(--gcore-text)] rounded hover:bg-gray-50 text-sm"
            >
              View Inference API
            </a>
          }
          <button
            (click)="loadNode()"
            class="px-4 py-2 border border-[var(--gcore-border)] text-[var(--gcore-text)] rounded hover:bg-gray-50 text-sm"
          >
            Refresh Data
          </button>
        </div>
      }
    </app-layout>
  `,
})
export class NodeDetailComponent implements OnInit {
  readonly Math = Math;

  node = signal<NodeDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<TabType>('overview');

  tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'history', label: 'History' },
  ];

  private nodeAddress: string = '';

  constructor(
    private route: ActivatedRoute,
    private nodesService: NodesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.nodeAddress = params['id'];
      this.loadNode();
    });
  }

  loadNode(): void {
    if (!this.nodeAddress) return;

    this.loading.set(true);
    this.error.set(null);

    this.nodesService.getNode(this.nodeAddress).subscribe({
      next: (node) => {
        if (node) {
          this.node.set(node);
        } else {
          this.error.set('Node not found or access denied');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load node details');
        this.loading.set(false);
      },
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800',
      unhealthy: 'bg-yellow-100 text-yellow-800',
      jailed: 'bg-red-100 text-red-800',
      offline: 'bg-gray-100 text-gray-800',
    };
    return classes[status] || classes['offline'];
  }

  getStatusTextClass(status: string): string {
    const classes: Record<string, string> = {
      healthy: 'text-green-600',
      unhealthy: 'text-yellow-600',
      jailed: 'text-red-600',
      offline: 'text-gray-600',
    };
    return classes[status] || classes['offline'];
  }
}
