import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NodesService } from '../../../core/services/nodes.service';
import { NodeDetail } from '../../../core/models/node.model';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { NodeDetailOverviewComponent } from './node-detail-overview/node-detail-overview.component';
import { NodeDetailMetricsComponent } from './node-detail-metrics/node-detail-metrics.component';
import { NodeDetailHistoryComponent } from './node-detail-history/node-detail-history.component';
import { getNodeStatusClass } from '../../../shared/utils/status-styles.util';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { BrnTabsImports } from '@spartan-ng/brain/tabs';

@Component({
  selector: 'app-node-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LayoutComponent,
    LoadingSpinnerComponent,
    NodeDetailOverviewComponent,
    NodeDetailMetricsComponent,
    NodeDetailHistoryComponent,
    BrnTabsImports,
    HlmTabsImports,
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
          <app-loading-spinner message="Loading node details..." />
        </div>
      }
      <!-- Content -->
      @if (!loading() && !error() && node()) {
        <!-- Spartan Tabs -->
        <hlm-tabs tab="overview" class="w-full">
          <hlm-tabs-list class="mb-6 w-full justify-start bg-transparent p-0 border-b border-[var(--gcore-border)] rounded-none">
            <button
              hlmTabsTrigger="overview"
              class="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gcore-primary)] data-[state=active]:text-[var(--gcore-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent"
            >
              Overview
            </button>
            <button
              hlmTabsTrigger="metrics"
              class="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gcore-primary)] data-[state=active]:text-[var(--gcore-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent"
            >
              Metrics
            </button>
            <button
              hlmTabsTrigger="history"
              class="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gcore-primary)] data-[state=active]:text-[var(--gcore-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent"
            >
              History
            </button>
          </hlm-tabs-list>

          <div hlmTabsContent="overview">
            <app-node-detail-overview [node]="node()!" />
          </div>

          <div hlmTabsContent="metrics">
            <app-node-detail-metrics [node]="node()!" />
          </div>

          <div hlmTabsContent="history">
            <app-node-detail-history />
          </div>
        </hlm-tabs>

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
  private route = inject(ActivatedRoute);
  private nodesService = inject(NodesService);

  node = signal<NodeDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  private nodeAddress: string = '';

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
