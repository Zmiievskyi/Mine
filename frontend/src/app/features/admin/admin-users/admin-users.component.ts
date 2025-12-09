import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AdminUser, UserNode, AssignNodeDto, UserRole } from '../../../core/models/admin.model';
import { AssignNodeModalComponent } from './assign-node-modal/assign-node-modal.component';
import { UserListItemComponent } from './user-list-item/user-list-item.component';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';

interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LayoutComponent,
    LoadingSpinnerComponent,
    AssignNodeModalComponent,
    UserListItemComponent,
    BrnDialogImports,
    HlmDialogImports,
    HlmButton,
  ],
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
          <app-loading-spinner message="Loading users..." />
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
            <app-user-list-item
              [user]="user"
              [isExpanded]="expandedUser() === user.id"
              (expand)="toggleUser(user.id)"
              (roleToggle)="toggleRole(user)"
              (activeToggle)="toggleActive(user)"
              (assignNode)="openAssignModal(user)"
              (nodeRemove)="removeNode(user.id, $event)"
            />
          }
        </div>

        @if (users().length === 0) {
          <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12 text-center">
            <p class="text-[var(--gcore-text-muted)]">No users found</p>
          </div>
        }
      }

      <!-- Assign Node Modal -->
      <app-assign-node-modal
        [user]="assigningUser()"
        [isOpen]="!!assigningUser()"
        [errorMessage]="assignError()"
        [isSubmitting]="assigning()"
        (close)="closeAssignModal()"
        (assign)="assignNode($event)"
      />

      <!-- Confirm Dialog -->
      <hlm-dialog [state]="confirmDialog() ? 'open' : 'closed'" (closed)="cancelConfirm()">
        <hlm-dialog-content *brnDialogContent="let ctx" class="sm:max-w-[400px]">
          <hlm-dialog-header>
            <h3 hlmDialogTitle>{{ confirmDialog()?.title }}</h3>
            <p hlmDialogDescription>{{ confirmDialog()?.message }}</p>
          </hlm-dialog-header>
          <hlm-dialog-footer>
            <button hlmBtn variant="outline" (click)="cancelConfirm()">Cancel</button>
            <button hlmBtn [variant]="confirmDialog()?.variant || 'default'" (click)="executeConfirm()">
              {{ confirmDialog()?.confirmText || 'Confirm' }}
            </button>
          </hlm-dialog-footer>
        </hlm-dialog-content>
      </hlm-dialog>
    </app-layout>
  `,
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private notification = inject(NotificationService);

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  expandedUser = signal<string | null>(null);
  assigningUser = signal<AdminUser | null>(null);
  assignError = signal<string | null>(null);
  assigning = signal(false);
  confirmDialog = signal<ConfirmDialogData | null>(null);

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

  toggleRole(user: AdminUser): void {
    const newRole: UserRole = user.role === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'make admin' : 'remove admin privileges from';

    this.confirmDialog.set({
      title: 'Change User Role',
      message: `Are you sure you want to ${action} ${user.email}?`,
      confirmText: newRole === 'admin' ? 'Make Admin' : 'Remove Admin',
      variant: newRole === 'admin' ? 'default' : 'destructive',
      onConfirm: () => {
        this.adminService.updateUser(user.id, { role: newRole }).subscribe({
          next: () => {
            this.notification.success('User role updated');
            this.loadUsers();
          },
          error: (err) => this.notification.error(err.error?.message || 'Failed to update user'),
        });
      },
    });
  }

  toggleActive(user: AdminUser): void {
    const action = user.isActive ? 'deactivate' : 'activate';

    this.confirmDialog.set({
      title: user.isActive ? 'Deactivate User' : 'Activate User',
      message: `Are you sure you want to ${action} ${user.email}?`,
      confirmText: user.isActive ? 'Deactivate' : 'Activate',
      variant: user.isActive ? 'destructive' : 'default',
      onConfirm: () => {
        this.adminService.updateUser(user.id, { isActive: !user.isActive }).subscribe({
          next: () => {
            this.notification.success(`User ${action}d successfully`);
            this.loadUsers();
          },
          error: (err) => this.notification.error(err.error?.message || 'Failed to update user'),
        });
      },
    });
  }

  openAssignModal(user: AdminUser): void {
    this.assignError.set(null);
    this.assigningUser.set(user);
  }

  closeAssignModal(): void {
    this.assigningUser.set(null);
    this.assignError.set(null);
  }

  assignNode(nodeData: AssignNodeDto): void {
    const user = this.assigningUser();
    if (!user) return;

    this.assigning.set(true);
    this.assignError.set(null);

    this.adminService.assignNode(user.id, nodeData).subscribe({
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
    const truncated = node.nodeAddress.length <= 20
      ? node.nodeAddress
      : `${node.nodeAddress.slice(0, 12)}...${node.nodeAddress.slice(-8)}`;

    this.confirmDialog.set({
      title: 'Remove Node',
      message: `Are you sure you want to remove node ${truncated}?`,
      confirmText: 'Remove',
      variant: 'destructive',
      onConfirm: () => {
        this.adminService.removeNode(userId, node.id).subscribe({
          next: () => {
            this.notification.success('Node removed successfully');
            this.loadUsers();
          },
          error: (err) => this.notification.error(err.error?.message || 'Failed to remove node'),
        });
      },
    });
  }

  cancelConfirm(): void {
    this.confirmDialog.set(null);
  }

  executeConfirm(): void {
    const dialog = this.confirmDialog();
    if (dialog) {
      dialog.onConfirm();
      this.confirmDialog.set(null);
    }
  }
}
