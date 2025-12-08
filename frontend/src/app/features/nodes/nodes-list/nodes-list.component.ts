import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NodesService } from '../../../core/services/nodes.service';
import { Node } from '../../../core/models/node.model';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-nodes-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LayoutComponent],
  template: `
    <app-layout>
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-[var(--gcore-text)]">My Nodes</h1>
          <p class="text-[var(--gcore-text-muted)] mt-1">
            Monitor your GPU nodes and track earnings
          </p>
        </div>
        <a
          routerLink="/nodes/request"
          class="px-4 py-2 bg-[var(--gcore-primary)] text-white rounded hover:opacity-90"
        >
          Request New Node
        </a>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12">
          <div class="flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gcore-primary)] mb-4"></div>
            <p class="text-[var(--gcore-text-muted)]">Loading nodes...</p>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div class="flex items-center gap-3">
            <span class="text-red-600 text-xl">!</span>
            <div>
              <h3 class="font-medium text-red-800">Failed to load nodes</h3>
              <p class="text-red-600 text-sm">{{ error() }}</p>
            </div>
          </div>
          <button
            (click)="loadNodes()"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      }

      <!-- Nodes Table -->
      @if (!loading() && !error()) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)]">
          @if (nodes().length === 0) {
            <div class="p-12 text-center">
              <div class="text-4xl mb-4 opacity-50">&#128187;</div>
              <h3 class="text-lg font-medium text-[var(--gcore-text)] mb-2">
                No nodes yet
              </h3>
              <p class="text-[var(--gcore-text-muted)] mb-4">
                Request your first GPU node to start mining GNK tokens.
              </p>
              <a
                routerLink="/nodes/request"
                class="inline-block px-6 py-2 bg-[var(--gcore-primary)] text-white rounded hover:opacity-90"
              >
                Request Node
              </a>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-[var(--gcore-border)]">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                      Node
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                      GPU Type
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                      Performance
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                      Earnings
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                      Uptime
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--gcore-border)]">
                  @for (node of nodes(); track node.id) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-6 py-4">
                        <div>
                          <a
                            [routerLink]="['/nodes', node.address]"
                            class="text-[var(--gcore-primary)] hover:underline font-medium"
                          >
                            {{ node.alias || 'Node ' + node.address.slice(0, 8) }}
                          </a>
                          <p class="text-xs text-[var(--gcore-text-muted)] mt-1 font-mono">
                            {{ node.address.slice(0, 16) }}...
                          </p>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="px-2 py-1 text-xs rounded-full font-medium"
                          [class]="getStatusClass(node.status)"
                        >
                          {{ node.status }}
                        </span>
                        @if (node.isJailed) {
                          <span class="ml-2 text-xs text-red-600">(jailed)</span>
                        }
                      </td>
                      <td class="px-6 py-4 text-[var(--gcore-text)]">
                        {{ node.gpuType }}
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-[var(--gcore-text)]">
                          {{ node.tokensPerSecond.toFixed(2) }} tok/s
                        </div>
                        <div class="text-xs text-[var(--gcore-text-muted)]">
                          {{ node.jobsCompleted }} jobs
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-[var(--gcore-primary)] font-medium">
                          {{ node.earnedCoins.toFixed(2) }} GNK
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              class="h-full rounded-full"
                              [class]="getUptimeBarClass(node.uptimePercent)"
                              [style.width.%]="node.uptimePercent"
                            ></div>
                          </div>
                          <span class="text-sm text-[var(--gcore-text)]">
                            {{ node.uptimePercent.toFixed(0) }}%
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <a
                          [routerLink]="['/nodes', node.address]"
                          class="text-[var(--gcore-primary)] hover:underline text-sm"
                        >
                          View Details
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Summary Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-[var(--gcore-border)]">
              <div class="flex items-center justify-between text-sm">
                <span class="text-[var(--gcore-text-muted)]">
                  {{ nodes().length }} node(s) total
                </span>
                <span class="text-[var(--gcore-text)]">
                  Total Earnings:
                  <span class="font-medium text-[var(--gcore-primary)]">
                    {{ getTotalEarnings().toFixed(2) }} GNK
                  </span>
                </span>
              </div>
            </div>
          }
        </div>
      }
    </app-layout>
  `,
})
export class NodesListComponent implements OnInit {
  nodes = signal<Node[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private nodesService: NodesService) {}

  ngOnInit(): void {
    this.loadNodes();
  }

  loadNodes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.nodesService.getNodes().subscribe({
      next: (nodes) => {
        this.nodes.set(nodes);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load nodes');
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

  getUptimeBarClass(uptime: number): string {
    if (uptime >= 90) return 'bg-green-500';
    if (uptime >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getTotalEarnings(): number {
    return this.nodes().reduce((sum, node) => sum + node.earnedCoins, 0);
  }
}
