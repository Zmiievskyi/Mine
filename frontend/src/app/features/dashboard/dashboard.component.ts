import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NodesService } from '../../core/services/nodes.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardData, Node } from '../../core/models/node.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[var(--gcore-bg)]">
      <!-- Header -->
      <header class="bg-white border-b border-[var(--gcore-border)] px-6 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-[var(--gcore-text)]">MineGNK Dashboard</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-[var(--gcore-text-muted)]">
              {{ authService.currentUser()?.email }}
            </span>
            <button
              (click)="logout()"
              class="text-sm text-[var(--gcore-primary)] hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div class="flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-white border-r border-[var(--gcore-border)] min-h-[calc(100vh-65px)]">
          <nav class="p-4">
            <ul class="space-y-2">
              <li>
                <a
                  routerLink="/dashboard"
                  class="block px-4 py-2 rounded bg-[var(--gcore-primary)] text-white"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  routerLink="/nodes"
                  class="block px-4 py-2 rounded text-[var(--gcore-text)] hover:bg-gray-100"
                >
                  My Nodes
                </a>
              </li>
              <li>
                <a
                  routerLink="/nodes/request"
                  class="block px-4 py-2 rounded text-[var(--gcore-text)] hover:bg-gray-100"
                >
                  Request Node
                </a>
              </li>
              @if (authService.isAdmin()) {
                <li class="pt-4 border-t border-[var(--gcore-border)] mt-4">
                  <a
                    routerLink="/admin"
                    class="block px-4 py-2 rounded text-[var(--gcore-text)] hover:bg-gray-100"
                  >
                    Admin Panel
                  </a>
                </li>
              }
            </ul>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-6">
          @if (loading()) {
            <div class="text-center py-12">
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
              <div class="px-6 py-4 border-b border-[var(--gcore-border)]">
                <h2 class="font-semibold text-[var(--gcore-text)]">Your Nodes</h2>
              </div>
              @if (nodes().length === 0) {
                <div class="p-6 text-center text-[var(--gcore-text-muted)]">
                  <p>No nodes yet.</p>
                  <a
                    routerLink="/nodes/request"
                    class="text-[var(--gcore-primary)] hover:underline"
                  >
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
                            [routerLink]="['/nodes', node.id]"
                            class="text-[var(--gcore-primary)] hover:underline font-medium"
                          >
                            {{ node.alias || node.address.slice(0, 12) + '...' }}
                          </a>
                        </td>
                        <td class="px-6 py-4">
                          <span
                            class="px-2 py-1 text-xs rounded-full"
                            [class]="getStatusClass(node.status)"
                          >
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
        </main>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  nodes = signal<Node[]>([]);
  stats = signal<DashboardData['stats'] | null>(null);

  constructor(
    private nodesService: NodesService,
    public authService: AuthService
  ) {}

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

  logout(): void {
    this.authService.logout();
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
