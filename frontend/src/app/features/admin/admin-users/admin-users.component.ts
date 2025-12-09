import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { AdminUser, UserNode, AssignNodeDto, UserRole } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LayoutComponent, DatePipe],
  template: `
    <app-layout>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-[var(--gcore-text)]">Manage Users</h1>
          <p class="text-[var(--gcore-text-muted)] mt-1">
            View users and assign nodes to them
          </p>
        </div>
        <a
          routerLink="/admin"
          class="px-4 py-2 border border-[var(--gcore-border)] rounded-lg hover:bg-gray-50"
        >
          Back to Admin
        </a>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12">
          <div class="flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gcore-primary)] mb-4"></div>
            <p class="text-[var(--gcore-text-muted)]">Loading users...</p>
          </div>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <p class="text-red-600">{{ error() }}</p>
          <button
            (click)="loadUsers()"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      }

      <!-- Users List -->
      @if (!loading() && !error()) {
        <div class="space-y-4">
          @for (user of users(); track user.id) {
            <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] overflow-hidden">
              <!-- User Header -->
              <div
                class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                (click)="toggleUser(user.id)"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    [class]="user.role === 'admin' ? 'bg-purple-500' : 'bg-[var(--gcore-primary)]'"
                  >
                    {{ user.name?.charAt(0) || user.email.charAt(0) | uppercase }}
                  </div>
                  <div>
                    <div class="font-medium text-[var(--gcore-text)]">
                      {{ user.name || 'No Name' }}
                      @if (user.role === 'admin') {
                        <span class="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">Admin</span>
                      }
                      @if (!user.isActive) {
                        <span class="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Inactive</span>
                      }
                    </div>
                    <div class="text-sm text-[var(--gcore-text-muted)]">{{ user.email }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div class="text-sm text-[var(--gcore-text-muted)]">
                    {{ user.nodes.length }} node(s)
                  </div>
                  <span class="text-[var(--gcore-text-muted)]">
                    {{ expandedUser() === user.id ? '&#9650;' : '&#9660;' }}
                  </span>
                </div>
              </div>

              <!-- Expanded Content -->
              @if (expandedUser() === user.id) {
                <div class="border-t border-[var(--gcore-border)] px-6 py-4 bg-gray-50">
                  <!-- User Actions -->
                  <div class="flex gap-2 mb-4">
                    <button
                      (click)="toggleRole(user)"
                      class="px-3 py-1 text-sm border border-[var(--gcore-border)] rounded hover:bg-white"
                    >
                      {{ user.role === 'admin' ? 'Remove Admin' : 'Make Admin' }}
                    </button>
                    <button
                      (click)="toggleActive(user)"
                      class="px-3 py-1 text-sm border border-[var(--gcore-border)] rounded hover:bg-white"
                    >
                      {{ user.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button
                      (click)="openAssignModal(user)"
                      class="px-3 py-1 text-sm bg-[var(--gcore-primary)] text-white rounded hover:opacity-90"
                    >
                      + Assign Node
                    </button>
                  </div>

                  <!-- Nodes Table -->
                  @if (user.nodes.length > 0) {
                    <table class="min-w-full divide-y divide-[var(--gcore-border)]">
                      <thead>
                        <tr>
                          <th class="py-2 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Node Address</th>
                          <th class="py-2 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Label</th>
                          <th class="py-2 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">GPU</th>
                          <th class="py-2 text-left text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Assigned</th>
                          <th class="py-2 text-right text-xs font-medium text-[var(--gcore-text-muted)] uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-[var(--gcore-border)] bg-white">
                        @for (node of user.nodes; track node.id) {
                          <tr>
                            <td class="py-3 font-mono text-sm text-[var(--gcore-text)]">
                              {{ truncateAddress(node.nodeAddress) }}
                            </td>
                            <td class="py-3 text-[var(--gcore-text)]">{{ node.label || '-' }}</td>
                            <td class="py-3 text-[var(--gcore-text)]">{{ node.gpuType || '-' }}</td>
                            <td class="py-3 text-sm text-[var(--gcore-text-muted)]">
                              {{ node.createdAt | date: 'MMM d, y' }}
                            </td>
                            <td class="py-3 text-right">
                              <button
                                (click)="removeNode(user.id, node)"
                                class="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  } @else {
                    <p class="text-[var(--gcore-text-muted)] text-sm py-4">No nodes assigned yet</p>
                  }
                </div>
              }
            </div>
          }
        </div>

        @if (users().length === 0) {
          <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12 text-center">
            <p class="text-[var(--gcore-text-muted)]">No users found</p>
          </div>
        }
      }

      <!-- Assign Node Modal -->
      @if (assigningUser()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 p-6">
            <h3 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">
              Assign Node to {{ assigningUser()?.name || assigningUser()?.email }}
            </h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[var(--gcore-text)] mb-1">
                  Node Address *
                </label>
                <input
                  type="text"
                  [(ngModel)]="newNode.nodeAddress"
                  placeholder="gonka1..."
                  class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded-lg focus:ring-2 focus:ring-[var(--gcore-primary)] focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-[var(--gcore-text)] mb-1">
                  Label
                </label>
                <input
                  type="text"
                  [(ngModel)]="newNode.label"
                  placeholder="e.g., Node-1"
                  class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded-lg focus:ring-2 focus:ring-[var(--gcore-primary)] focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-[var(--gcore-text)] mb-1">
                  GPU Type
                </label>
                <select
                  [(ngModel)]="newNode.gpuType"
                  class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded-lg focus:ring-2 focus:ring-[var(--gcore-primary)] focus:border-transparent"
                >
                  <option value="">Select GPU Type</option>
                  <option value="RTX 3080">RTX 3080</option>
                  <option value="RTX 4090">RTX 4090</option>
                  <option value="H100">H100</option>
                  <option value="H200">H200</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-[var(--gcore-text)] mb-1">
                  Notes
                </label>
                <textarea
                  [(ngModel)]="newNode.notes"
                  rows="2"
                  placeholder="Optional notes..."
                  class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded-lg focus:ring-2 focus:ring-[var(--gcore-primary)] focus:border-transparent"
                ></textarea>
              </div>
            </div>

            @if (assignError()) {
              <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {{ assignError() }}
              </div>
            }

            <div class="flex gap-3 mt-6">
              <button
                (click)="assignNode()"
                [disabled]="!newNode.nodeAddress || assigning()"
                class="flex-1 py-2 bg-[var(--gcore-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {{ assigning() ? 'Assigning...' : 'Assign Node' }}
              </button>
              <button
                (click)="closeAssignModal()"
                class="flex-1 py-2 border border-[var(--gcore-border)] rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </app-layout>
  `,
})
export class AdminUsersComponent implements OnInit {
  users = signal<AdminUser[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  expandedUser = signal<string | null>(null);
  assigningUser = signal<AdminUser | null>(null);
  assignError = signal<string | null>(null);
  assigning = signal(false);

  newNode: AssignNodeDto = { nodeAddress: '', label: '', gpuType: '', notes: '' };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load users');
        this.loading.set(false);
      },
    });
  }

  toggleUser(id: string): void {
    this.expandedUser.set(this.expandedUser() === id ? null : id);
  }

  truncateAddress(address: string): string {
    if (address.length <= 20) return address;
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  }

  toggleRole(user: AdminUser): void {
    const newRole: UserRole = user.role === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'make admin' : 'remove admin privileges from';
    if (!confirm(`Are you sure you want to ${action} ${user.email}?`)) return;

    this.adminService.updateUser(user.id, { role: newRole }).subscribe({
      next: () => this.loadUsers(),
      error: (err) => alert(err.error?.message || 'Failed to update user'),
    });
  }

  toggleActive(user: AdminUser): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${user.email}?`)) return;

    this.adminService.updateUser(user.id, { isActive: !user.isActive }).subscribe({
      next: () => this.loadUsers(),
      error: (err) => alert(err.error?.message || 'Failed to update user'),
    });
  }

  openAssignModal(user: AdminUser): void {
    this.newNode = { nodeAddress: '', label: '', gpuType: '', notes: '' };
    this.assignError.set(null);
    this.assigningUser.set(user);
  }

  closeAssignModal(): void {
    this.assigningUser.set(null);
    this.assignError.set(null);
  }

  assignNode(): void {
    const user = this.assigningUser();
    if (!user || !this.newNode.nodeAddress) return;

    this.assigning.set(true);
    this.assignError.set(null);

    this.adminService.assignNode(user.id, this.newNode).subscribe({
      next: () => {
        this.assigning.set(false);
        this.closeAssignModal();
        this.loadUsers();
      },
      error: (err) => {
        this.assigning.set(false);
        this.assignError.set(err.error?.message || 'Failed to assign node');
      },
    });
  }

  removeNode(userId: string, node: UserNode): void {
    if (!confirm(`Remove node ${this.truncateAddress(node.nodeAddress)}?`)) return;

    this.adminService.removeNode(userId, node.id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => alert(err.error?.message || 'Failed to remove node'),
    });
  }
}
