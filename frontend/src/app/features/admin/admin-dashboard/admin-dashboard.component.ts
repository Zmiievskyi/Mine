import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { AdminDashboardStats, NetworkHealthOverview } from '../../../core/models/admin.model';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LayoutComponent, HlmCardImports],
  template: `
    <app-layout>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-[var(--gcore-text)]">Admin Panel</h1>
        <p class="text-[var(--gcore-text-muted)] mt-1">
          Manage users, nodes, and requests
        </p>
      </div>

      <!-- Health Alerts -->
      @if (networkHealth().jailedNodes > 0 || networkHealth().offlineNodes > 0) {
        <div class="mb-6 space-y-2">
          @if (networkHealth().offlineNodes > 0) {
            <a
              routerLink="/admin/nodes"
              [queryParams]="{ status: 'offline' }"
              class="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <span class="text-2xl">&#9888;</span>
              <div>
                <div class="font-semibold text-red-800">
                  {{ networkHealth().offlineNodes }} node(s) offline
                </div>
                <div class="text-sm text-red-600">
                  Click to view offline nodes
                </div>
              </div>
            </a>
          }
          @if (networkHealth().jailedNodes > 0) {
            <a
              routerLink="/admin/nodes"
              [queryParams]="{ status: 'jailed' }"
              class="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <span class="text-2xl">&#128274;</span>
              <div>
                <div class="font-semibold text-yellow-800">
                  {{ networkHealth().jailedNodes }} node(s) jailed
                </div>
                <div class="text-sm text-yellow-600">
                  Click to view jailed nodes
                </div>
              </div>
            </a>
          }
        </div>
      }

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <section hlmCard>
          <div hlmCardContent class="p-6">
            <div class="text-3xl font-bold text-[var(--gcore-text)]">{{ stats().totalUsers }}</div>
            <div class="text-sm text-[var(--gcore-text-muted)] mt-1">Total Users</div>
          </div>
        </section>
        <section hlmCard class="border-[var(--gcore-primary)]">
          <div hlmCardContent class="p-6">
            <div class="text-3xl font-bold text-[var(--gcore-primary)]">{{ stats().totalNodes }}</div>
            <div class="text-sm text-[var(--gcore-text-muted)] mt-1">Active Nodes</div>
          </div>
        </section>
        <section hlmCard class="border-yellow-200">
          <div hlmCardContent class="p-6">
            <div class="text-3xl font-bold text-yellow-600">{{ stats().pendingRequests }}</div>
            <div class="text-sm text-[var(--gcore-text-muted)] mt-1">Pending Requests</div>
          </div>
        </section>
        <section hlmCard class="border-green-200">
          <div hlmCardContent class="p-6">
            <div class="text-3xl font-bold text-green-600">{{ stats().approvedRequests }}</div>
            <div class="text-sm text-[var(--gcore-text-muted)] mt-1">Approved Requests</div>
          </div>
        </section>
      </div>

      <!-- Network Health Section -->
      @if (networkHealth().totalNodes > 0) {
        <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">Network Health</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <a routerLink="/admin/nodes" class="block hover:opacity-80 transition-opacity">
            <section hlmCard>
              <div hlmCardContent class="p-4">
                <div class="text-2xl font-bold text-[var(--gcore-text)]">{{ networkHealth().totalNodes }}</div>
                <div class="text-xs text-[var(--gcore-text-muted)] mt-1">Total Nodes</div>
              </div>
            </section>
          </a>
          <a routerLink="/admin/nodes" [queryParams]="{ status: 'healthy' }" class="block hover:opacity-80 transition-opacity">
            <section hlmCard class="border-green-200">
              <div hlmCardContent class="p-4">
                <div class="text-2xl font-bold text-green-600">{{ networkHealth().healthyNodes }}</div>
                <div class="text-xs text-[var(--gcore-text-muted)] mt-1">Healthy</div>
              </div>
            </section>
          </a>
          <a routerLink="/admin/nodes" [queryParams]="{ status: 'jailed' }" class="block hover:opacity-80 transition-opacity">
            <section hlmCard class="border-yellow-200">
              <div hlmCardContent class="p-4">
                <div class="text-2xl font-bold text-yellow-600">{{ networkHealth().jailedNodes }}</div>
                <div class="text-xs text-[var(--gcore-text-muted)] mt-1">Jailed</div>
              </div>
            </section>
          </a>
          <a routerLink="/admin/nodes" [queryParams]="{ status: 'offline' }" class="block hover:opacity-80 transition-opacity">
            <section hlmCard class="border-red-200">
              <div hlmCardContent class="p-4">
                <div class="text-2xl font-bold text-red-600">{{ networkHealth().offlineNodes }}</div>
                <div class="text-xs text-[var(--gcore-text-muted)] mt-1">Offline</div>
              </div>
            </section>
          </a>
          <section hlmCard class="border-gray-200">
            <div hlmCardContent class="p-4">
              <div class="text-2xl font-bold text-gray-500">{{ networkHealth().unknownNodes }}</div>
              <div class="text-xs text-[var(--gcore-text-muted)] mt-1">Unknown</div>
            </div>
          </section>
          <section hlmCard class="border-[var(--gcore-primary)]">
            <div hlmCardContent class="p-4">
              <div class="text-2xl font-bold text-[var(--gcore-primary)]">{{ networkHealth().totalEarnings }}</div>
              <div class="text-xs text-[var(--gcore-text-muted)] mt-1">Total GNK</div>
            </div>
          </section>
        </div>
      }

      <!-- Quick Actions -->
      <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <a routerLink="/admin/requests" class="block group">
          <section hlmCard class="h-full hover:border-[var(--gcore-primary)] transition-colors">
            <div hlmCardContent class="p-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">
                  &#128203;
                </div>
                <div>
                  <h3 class="font-semibold text-[var(--gcore-text)] group-hover:text-[var(--gcore-primary)]">
                    Manage Requests
                  </h3>
                  <p class="text-sm text-[var(--gcore-text-muted)]">
                    Review and process node provisioning requests
                  </p>
                </div>
              </div>
              @if (stats().pendingRequests > 0) {
                <div class="mt-4 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  {{ stats().pendingRequests }} pending request(s) need attention
                </div>
              }
            </div>
          </section>
        </a>

        <a routerLink="/admin/users" class="block group">
          <section hlmCard class="h-full hover:border-[var(--gcore-primary)] transition-colors">
            <div hlmCardContent class="p-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                  &#128101;
                </div>
                <div>
                  <h3 class="font-semibold text-[var(--gcore-text)] group-hover:text-[var(--gcore-primary)]">
                    Manage Users
                  </h3>
                  <p class="text-sm text-[var(--gcore-text-muted)]">
                    View users and assign nodes to them
                  </p>
                </div>
              </div>
              <div class="mt-4 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                {{ stats().totalUsers }} registered user(s)
              </div>
            </div>
          </section>
        </a>

        <a routerLink="/admin/nodes" class="block group">
          <section hlmCard class="h-full hover:border-[var(--gcore-primary)] transition-colors">
            <div hlmCardContent class="p-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
                  &#128421;
                </div>
                <div>
                  <h3 class="font-semibold text-[var(--gcore-text)] group-hover:text-[var(--gcore-primary)]">
                    All Nodes
                  </h3>
                  <p class="text-sm text-[var(--gcore-text-muted)]">
                    View all nodes with live stats
                  </p>
                </div>
              </div>
              <div class="mt-4 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                {{ stats().totalNodes }} active node(s)
              </div>
            </div>
          </section>
        </a>

        <a routerLink="/admin/analytics" class="block group">
          <section hlmCard class="h-full hover:border-[var(--gcore-primary)] transition-colors">
            <div hlmCardContent class="p-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                  &#128202;
                </div>
                <div>
                  <h3 class="font-semibold text-[var(--gcore-text)] group-hover:text-[var(--gcore-primary)]">
                    Analytics
                  </h3>
                  <p class="text-sm text-[var(--gcore-text-muted)]">
                    View detailed analytics and reports
                  </p>
                </div>
              </div>
              <div class="mt-4 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                Overview of users, nodes, and requests
              </div>
            </div>
          </section>
        </a>
      </div>

      <!-- Back Link -->
      <div class="mt-8">
        <a
          routerLink="/dashboard"
          class="text-[var(--gcore-primary)] hover:underline"
        >
          &larr; Back to Dashboard
        </a>
      </div>
    </app-layout>
  `,
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<AdminDashboardStats>({
    totalUsers: 0,
    totalNodes: 0,
    pendingRequests: 0,
    approvedRequests: 0,
  });

  networkHealth = signal<NetworkHealthOverview>({
    totalNodes: 0,
    healthyNodes: 0,
    jailedNodes: 0,
    offlineNodes: 0,
    unknownNodes: 0,
    totalEarnings: '0',
  });

  private adminService = inject(AdminService);

  ngOnInit(): void {
    forkJoin({
      stats: this.adminService.getDashboardStats(),
      health: this.adminService.getNetworkHealth(),
    }).subscribe({
      next: ({ stats, health }) => {
        this.stats.set(stats);
        this.networkHealth.set(health);
      },
      error: () => {},
    });
  }
}
