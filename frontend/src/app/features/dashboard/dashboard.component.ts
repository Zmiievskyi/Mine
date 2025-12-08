import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NodesService } from '../../core/services/nodes.service';
import { DashboardData, Node } from '../../core/models/node.model';
import { LayoutComponent } from '../../shared/components/layout/layout.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LayoutComponent],
  template: `
    <app-layout>
      @if (loading()) {
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gcore-primary)] mx-auto mb-4"></div>
          <p class="text-[var(--gcore-text-muted)]">Loading dashboard...</p>
        </div>
      } @else {
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-[var(--gcore-border)]">
            <p class="text-sm text-[var(--gcore-text-muted)]">Active Nodes</p>
            <p class="text-2xl font-bold text-[var(--gcore-text)]">
              {{ stats()?.totalNodes || 0 }}
            </p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-[var(--gcore-border)]">
            <p class="text-sm text-[var(--gcore-text-muted)]">Healthy Nodes</p>
            <p class="text-2xl font-bold text-green-600">
              {{ stats()?.healthyNodes || 0 }}
            </p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-[var(--gcore-border)]">
            <p class="text-sm text-[var(--gcore-text-muted)]">Total Earnings</p>
            <p class="text-2xl font-bold text-[var(--gcore-primary)]">
              {{ stats()?.totalEarnings?.toFixed(2) || '0.00' }} GNK
            </p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-[var(--gcore-border)]">
            <p class="text-sm text-[var(--gcore-text-muted)]">Avg Uptime</p>
            <p class="text-2xl font-bold text-[var(--gcore-text)]">
              {{ stats()?.averageUptime?.toFixed(1) || '0' }}%
            </p>
          </div>
        </div>

        <!-- Nodes Table -->
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)]">
          <div class="px-6 py-4 border-b border-[var(--gcore-border)] flex items-center justify-between">
            <h2 class="font-semibold text-[var(--gcore-text)]">Your Nodes</h2>
            <a routerLink="/nodes" class="text-sm text-[var(--gcore-primary)] hover:underline">
              View All
            </a>
          </div>
          @if (nodes().length === 0) {
            <div class="p-6 text-center text-[var(--gcore-text-muted)]">
              <p>No nodes yet.</p>
              <a routerLink="/nodes/request" class="text-[var(--gcore-primary)] hover:underline">
                Request your first node
              </a>
            </div>
          } @else {
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">
                    Node
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">
                    GPU
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">
                    Earnings
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">
                    Uptime
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--gcore-border)]">
                @for (node of nodes(); track node.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <a
                        [routerLink]="['/nodes', node.address]"
                        class="text-[var(--gcore-primary)] hover:underline font-medium"
                      >
                        {{ node.alias || node.address.slice(0, 12) + '...' }}
                      </a>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 text-xs rounded-full" [class]="getStatusClass(node.status)">
                        {{ node.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-[var(--gcore-text)]">
                      {{ node.gpuType }}
                    </td>
                    <td class="px-6 py-4 text-[var(--gcore-text)]">
                      {{ node.earnedCoins.toFixed(2) }} GNK
                    </td>
                    <td class="px-6 py-4 text-[var(--gcore-text)]">
                      {{ node.uptimePercent.toFixed(1) }}%
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </app-layout>
  `,
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  nodes = signal<Node[]>([]);
  stats = signal<DashboardData['stats'] | null>(null);

  constructor(private nodesService: NodesService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.nodesService.getDashboardData().subscribe({
      next: (data) => {
        this.nodes.set(data.nodes);
        this.stats.set(data.stats);
        this.loading.set(false);
      },
      error: () => {
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
}
