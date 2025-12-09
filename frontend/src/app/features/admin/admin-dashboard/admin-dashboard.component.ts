import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { AdminDashboardStats } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LayoutComponent],
  template: `
    <app-layout>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-[var(--gcore-text)]">Admin Panel</h1>
        <p class="text-[var(--gcore-text-muted)] mt-1">
          Manage users, nodes, and requests
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
          <div class="text-3xl font-bold text-[var(--gcore-text)]">{{ stats().totalUsers }}</div>
          <div class="text-sm text-[var(--gcore-text-muted)] mt-1">Total Users</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
          <div class="text-3xl font-bold text-[var(--gcore-primary)]">{{ stats().totalNodes }}</div>
          <div class="text-sm text-[var(--gcore-text-muted)] mt-1">Active Nodes</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
          <div class="text-3xl font-bold text-yellow-600">{{ stats().pendingRequests }}</div>
          <div class="text-sm text-[var(--gcore-text-muted)] mt-1">Pending Requests</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
          <div class="text-3xl font-bold text-green-600">{{ stats().approvedRequests }}</div>
          <div class="text-sm text-[var(--gcore-text-muted)] mt-1">Approved Requests</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          routerLink="/admin/requests"
          class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6 hover:border-[var(--gcore-primary)] transition-colors group"
        >
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
        </a>

        <a
          routerLink="/admin/users"
          class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6 hover:border-[var(--gcore-primary)] transition-colors group"
        >
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

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {},
    });
  }
}
