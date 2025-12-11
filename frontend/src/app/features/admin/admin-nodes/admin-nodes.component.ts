import { Component, OnInit, signal, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LayoutComponent, LoadingSpinnerComponent, PaginationComponent } from '../../../shared/components';
import {
  AdminNodeWithUser,
  AdminNodesQuery,
  NetworkHealthOverview,
  NodeStatus,
} from '../../../core/models/admin.model';
import { createDebounce, downloadBlobWithDate, getNodeStatusVariant, truncateAddress, handleApiError } from '../../../shared/utils';
import { DEBOUNCE_DELAYS } from '../../../core/constants';
import { PaginationMeta } from '../../../shared/types';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-admin-nodes',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    LayoutComponent,
    LoadingSpinnerComponent,
    PaginationComponent,
    HlmTableImports,
    HlmBadge,
    HlmButton,
    HlmInput,
    HlmLabel,
    BrnSelectImports,
    HlmSelectImports,
    HlmCardImports,
  ],
  templateUrl: './admin-nodes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNodesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly nodes = signal<AdminNodeWithUser[]>([]);
  protected readonly health = signal<NetworkHealthOverview | null>(null);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly exporting = signal(false);

  // Filter state
  public searchQuery = '';
  public statusFilter: 'healthy' | 'jailed' | 'offline' | 'all' = 'all';
  public gpuFilter = '';
  public sortBy: 'earnings' | 'user' | 'createdAt' = 'createdAt';
  public currentPage = 1;

  private readonly searchDebounce = createDebounce();

  public ngOnInit(): void {
    // Read initial filter from query params
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['status'] && ['healthy', 'jailed', 'offline', 'all'].includes(params['status'])) {
        this.statusFilter = params['status'];
      }
      if (params['gpuType']) {
        this.gpuFilter = params['gpuType'];
      }
      this.loadHealth();
      this.loadNodes();
    });
  }

  private loadHealth(): void {
    this.adminService
      .getNetworkHealth()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (health) => this.health.set(health),
        error: () => {}, // Silent fail for health stats
      });
  }

  protected loadNodes(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: AdminNodesQuery = {
      page: this.currentPage,
      limit: 20,
      status: this.statusFilter,
      gpuType: this.gpuFilter || undefined,
      search: this.searchQuery || undefined,
      sortBy: this.sortBy,
      sortOrder: 'desc',
    };

    this.adminService
      .getAllNodes(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.nodes.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: (err) => handleApiError(err, 'Failed to load nodes', this.error, this.loading),
      });
  }

  protected onFilterChange(): void {
    this.searchDebounce(() => {
      this.currentPage = 1;
      this.loadNodes();
    }, DEBOUNCE_DELAYS.SEARCH);
  }

  protected goToPage(page: number): void {
    this.currentPage = page;
    this.loadNodes();
  }

  protected readonly getTruncatedAddress = truncateAddress;
  protected readonly getStatusVariant = getNodeStatusVariant;

  protected copyAddress(address: string): void {
    navigator.clipboard.writeText(address).then(() => {
      this.notification.success('Address copied to clipboard');
    });
  }

  protected exportToCsv(): void {
    this.exporting.set(true);
    this.adminService
      .exportNodes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          downloadBlobWithDate(blob, 'nodes');
          this.exporting.set(false);
        },
        error: () => {
          this.notification.error('Failed to export nodes');
          this.exporting.set(false);
        },
      });
  }
}
