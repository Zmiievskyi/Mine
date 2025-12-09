import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NodesService } from '../../../core/services/nodes.service';
import { NodeDetail } from '../../../core/models/node.model';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { NodeDetailOverviewComponent } from './node-detail-overview/node-detail-overview.component';
import { NodeDetailMetricsComponent } from './node-detail-metrics/node-detail-metrics.component';
import { NodeDetailHistoryComponent } from './node-detail-history/node-detail-history.component';
import { getNodeStatusClass } from '../../../shared/utils/status-styles.util';

type TabType = 'overview' | 'metrics' | 'history';

@Component({
  selector: 'app-node-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LayoutComponent,
    NodeDetailOverviewComponent,
    NodeDetailMetricsComponent,
    NodeDetailHistoryComponent,
  ],
  template: `
    <app-layout>
      <!-- Back Link & Header -->
      <div class="mb-6">
        <a routerLink="/nodes" class="text-sm text-[var(--gcore-text-muted)] hover:text-[var(--gcore-primary)] flex items-center gap-1 mb-4">
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
              [class]="getNodeStatusClass(node()?.status || 'offline')"
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
          <button (click)="loadNode()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
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
        @if (activeTab() === 'overview' && node()) {
          <app-node-detail-overview [node]="node()!" />
        }
        <!-- Metrics Tab -->
        @if (activeTab() === 'metrics' && node()) {
          <app-node-detail-metrics [node]="node()!" />
        }
        <!-- History Tab -->
        @if (activeTab() === 'history') {
          <app-node-detail-history />
        }
        <!-- Quick Actions -->
        <div class="mt-6 flex gap-4">
          @if (node()?.inferenceUrl) {
            <a [href]="node()?.inferenceUrl" target="_blank" rel="noopener noreferrer" class="px-4 py-2 border border-[var(--gcore-border)] text-[var(--gcore-text)] rounded hover:bg-gray-50 text-sm">
              View Inference API
            </a>
          }
          <button (click)="loadNode()" class="px-4 py-2 border border-[var(--gcore-border)] text-[var(--gcore-text)] rounded hover:bg-gray-50 text-sm">
            Refresh Data
          </button>
        </div>
      }
    </app-layout>
  `,
})
export class NodeDetailComponent implements OnInit {
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

  getNodeStatusClass = getNodeStatusClass;
}
