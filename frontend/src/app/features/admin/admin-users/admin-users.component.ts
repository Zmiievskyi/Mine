import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AdminUser, AdminUserWithStats, UserNode, UserNodeWithStats, AssignNodeDto, UserRole, AdminUsersQuery, KycStatus } from '../../../core/models/admin.model';
import { AssignNodeModalComponent } from './assign-node-modal/assign-node-modal.component';
import { UserListItemComponent } from './user-list-item/user-list-item.component';
import { createDebounce, truncateAddress, downloadBlobWithDate, handleApiError, extractErrorMessage } from '../../../shared/utils';
import { DEBOUNCE_DELAYS } from '../../../core/constants';
import { ConfirmDialogData } from '../../../shared/models/confirm-dialog.model';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    LayoutComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    AssignNodeModalComponent,
    UserListItemComponent,
    HlmButton,
    HlmInput,
    HlmLabel,
    BrnSelectImports,
    HlmSelectImports,
    HlmCardImports,
    BrnDialogImports,
    HlmDialogImports,
  ],
  templateUrl: './admin-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly notification = inject(NotificationService);
  protected readonly Math = Math;

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly meta = signal<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly expandedUser = signal<string | null>(null);
  protected readonly expandedUserData = signal<AdminUserWithStats | null>(null);
  protected readonly expandedUserLoading = signal(false);
  protected readonly assigningUser = signal<AdminUser | null>(null);
  protected readonly assignError = signal<string | null>(null);
  protected readonly assigning = signal(false);
  protected readonly exporting = signal(false);
  protected readonly confirmDialog = signal<ConfirmDialogData | null>(null);
  private pendingAction: (() => void) | null = null;

  // Filter state
  public searchQuery = '';
  public roleFilter: 'user' | 'admin' | 'all' = 'all';
  public activeFilter: 'true' | 'false' | 'all' = 'all';
  public kycFilter: KycStatus | 'all' = 'all';
  public sortBy: 'nodeCount' | 'createdAt' | 'email' = 'createdAt';
  public currentPage = 1;

  // KYC rejection modal state
  protected readonly rejectingUser = signal<AdminUser | null>(null);
  protected readonly rejectionReason = signal('');

  private readonly searchDebounce = createDebounce();

  public ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: AdminUsersQuery = {
      page: this.currentPage,
      limit: 20,
      search: this.searchQuery || undefined,
      role: this.roleFilter,
      isActive: this.activeFilter === 'all' ? undefined : this.activeFilter === 'true',
      kycStatus: this.kycFilter === 'all' ? undefined : this.kycFilter,
      sortBy: this.sortBy,
      sortOrder: 'desc',
    };

    this.adminService.getUsers(query).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: (err) => handleApiError(err, 'Failed to load users', this.error, this.loading),
    });
  }

  protected onFilterChange(): void {
    this.searchDebounce(() => {
      this.currentPage = 1;
      this.loadUsers();
    }, DEBOUNCE_DELAYS.SEARCH);
  }

  protected goToPage(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  protected toggleUser(id: string): void {
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

  protected toggleRole(user: AdminUser): void {
    const newRole: UserRole = user.role === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'make admin' : 'remove admin privileges from';

    this.confirmDialog.set({
      title: 'Change User Role',
      message: `Are you sure you want to ${action} ${user.email}?`,
      confirmText: newRole === 'admin' ? 'Make Admin' : 'Remove Admin',
      variant: newRole === 'admin' ? 'default' : 'destructive',
    });

    // Store the action for confirmation handler
    this.pendingAction = () => {
      this.adminService.updateUser(user.id, { role: newRole }).subscribe({
        next: () => {
          this.notification.success('User role updated');
          this.loadUsers();
        },
        error: (err) => this.notification.error(extractErrorMessage(err, 'Failed to update user')),
      });
    };
  }

  protected toggleActive(user: AdminUser): void {
    const action = user.isActive ? 'deactivate' : 'activate';

    this.confirmDialog.set({
      title: user.isActive ? 'Deactivate User' : 'Activate User',
      message: `Are you sure you want to ${action} ${user.email}?`,
      confirmText: user.isActive ? 'Deactivate' : 'Activate',
      variant: user.isActive ? 'destructive' : 'default',
    });

    // Store the action for confirmation handler
    this.pendingAction = () => {
      this.adminService.updateUser(user.id, { isActive: !user.isActive }).subscribe({
        next: () => {
          this.notification.success(`User ${action}d successfully`);
          this.loadUsers();
        },
        error: (err) => this.notification.error(extractErrorMessage(err, 'Failed to update user')),
      });
    };
  }

  protected openAssignModal(user: AdminUser): void {
    this.assignError.set(null);
    this.assigningUser.set(user);
  }

  protected closeAssignModal(): void {
    this.assigningUser.set(null);
    this.assignError.set(null);
  }

  protected assignNode(nodeData: AssignNodeDto): void {
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
      error: (err) => handleApiError(err, 'Failed to assign node', this.assignError, this.assigning),
    });
  }

  protected removeNode(userId: string, node: UserNode | UserNodeWithStats): void {
    const truncated = truncateAddress(node.nodeAddress);

    this.confirmDialog.set({
      title: 'Remove Node',
      message: `Are you sure you want to remove node ${truncated}?`,
      confirmText: 'Remove',
      variant: 'destructive',
    });

    // Store the action for confirmation handler
    this.pendingAction = () => {
      this.adminService.removeNode(userId, node.id).subscribe({
        next: () => {
          this.notification.success('Node removed successfully');
          this.loadUsers();
          // Refresh expanded user data if still expanded
          if (this.expandedUser() === userId) {
            this.loadUserWithStats(userId);
          }
        },
        error: (err) => this.notification.error(extractErrorMessage(err, 'Failed to remove node')),
      });
    };
  }

  protected onConfirmDialogCancel(): void {
    this.confirmDialog.set(null);
    this.pendingAction = null;
  }

  protected onConfirmDialogConfirm(): void {
    if (this.pendingAction) {
      this.pendingAction();
      this.confirmDialog.set(null);
      this.pendingAction = null;
    }
  }

  protected exportToCsv(): void {
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

  // KYC Management Methods
  protected verifyKyc(user: AdminUser): void {
    this.confirmDialog.set({
      title: 'Verify KYC',
      message: `Are you sure you want to verify KYC for ${user.email}?`,
      confirmText: 'Verify',
      variant: 'default',
    });

    this.pendingAction = () => {
      this.adminService.verifyKyc(user.id).subscribe({
        next: () => {
          this.notification.success('KYC verified successfully');
          this.loadUsers();
          if (this.expandedUser() === user.id) {
            this.loadUserWithStats(user.id);
          }
        },
        error: (err) => this.notification.error(extractErrorMessage(err, 'Failed to verify KYC')),
      });
    };
  }

  protected openRejectKycModal(user: AdminUser): void {
    this.rejectingUser.set(user);
    this.rejectionReason.set('');
  }

  protected closeRejectKycModal(): void {
    this.rejectingUser.set(null);
    this.rejectionReason.set('');
  }

  protected submitKycRejection(): void {
    const user = this.rejectingUser();
    const reason = this.rejectionReason();
    if (!user || !reason.trim()) return;

    this.adminService.rejectKyc(user.id, reason).subscribe({
      next: () => {
        this.notification.success('KYC rejected');
        this.closeRejectKycModal();
        this.loadUsers();
        if (this.expandedUser() === user.id) {
          this.loadUserWithStats(user.id);
        }
      },
      error: (err) => this.notification.error(extractErrorMessage(err, 'Failed to reject KYC')),
    });
  }
}
