import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AdminUser, AdminUserWithStats, UserNode, UserNodeWithStats, AssignNodeDto, UserRole, AdminUsersQuery } from '../../../core/models/admin.model';
import { AssignNodeModalComponent } from './assign-node-modal/assign-node-modal.component';
import { UserListItemComponent } from './user-list-item/user-list-item.component';
import { createDebounce } from '../../../shared/utils/debounce.util';
import { downloadBlobWithDate } from '../../../shared/utils/download.util';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmCardImports } from '@spartan-ng/helm/card';

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
    FormsModule,
    LayoutComponent,
    LoadingSpinnerComponent,
    AssignNodeModalComponent,
    UserListItemComponent,
    BrnDialogImports,
    HlmDialogImports,
    HlmButton,
    HlmInput,
    HlmLabel,
    BrnSelectImports,
    HlmSelectImports,
    HlmCardImports,
  ],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private notification = inject(NotificationService);
  protected Math = Math;

  users = signal<AdminUser[]>([]);
  meta = signal<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  expandedUser = signal<string | null>(null);
  expandedUserData = signal<AdminUserWithStats | null>(null);
  expandedUserLoading = signal(false);
  assigningUser = signal<AdminUser | null>(null);
  assignError = signal<string | null>(null);
  assigning = signal(false);
  exporting = signal(false);
  confirmDialog = signal<ConfirmDialogData | null>(null);

  // Filter state
  searchQuery = '';
  roleFilter: 'user' | 'admin' | 'all' = 'all';
  activeFilter: 'true' | 'false' | 'all' = 'all';
  sortBy: 'nodeCount' | 'createdAt' | 'email' = 'createdAt';
  currentPage = 1;

  private searchDebounce = createDebounce();

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: AdminUsersQuery = {
      page: this.currentPage,
      limit: 20,
      search: this.searchQuery || undefined,
      role: this.roleFilter,
      isActive: this.activeFilter === 'all' ? undefined : this.activeFilter === 'true',
      sortBy: this.sortBy,
      sortOrder: 'desc',
    };

    this.adminService.getUsers(query).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load users');
        this.loading.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.searchDebounce(() => {
      this.currentPage = 1;
      this.loadUsers();
    }, 300);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  toggleUser(id: string): void {
    if (this.expandedUser() === id) {
      this.expandedUser.set(null);
      this.expandedUserData.set(null);
    } else {
      this.expandedUser.set(id);
      this.loadUserWithStats(id);
    }
  }

  private loadUserWithStats(id: string): void {
    this.expandedUserLoading.set(true);
    this.adminService.getUser(id).subscribe({
      next: (user) => {
        this.expandedUserData.set(user);
        this.expandedUserLoading.set(false);
      },
      error: () => {
        this.expandedUserLoading.set(false);
      },
    });
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

  removeNode(userId: string, node: UserNode | UserNodeWithStats): void {
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
            // Refresh expanded user data if still expanded
            if (this.expandedUser() === userId) {
              this.loadUserWithStats(userId);
            }
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

  exportToCsv(): void {
    this.exporting.set(true);
    this.adminService.exportUsers().subscribe({
      next: (blob) => {
        downloadBlobWithDate(blob, 'users');
        this.exporting.set(false);
      },
      error: () => {
        this.notification.error('Failed to export users');
        this.exporting.set(false);
      },
    });
  }
}
