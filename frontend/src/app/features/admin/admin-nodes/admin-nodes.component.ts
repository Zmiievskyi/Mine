import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LayoutComponent, LoadingSpinnerComponent, PaginationComponent } from '../../../shared/components';
import {
  AdminNodeWithUser,
  AdminNodesQuery,
  NetworkHealthOverview,
  NodeStatus,
} from '../../../core/models/admin.model';
import { createDebounce, downloadBlobWithDate, getNodeStatusVariant, truncateAddress } from '../../../shared/utils';
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
    CommonModule,
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
})
export class AdminNodesComponent implements OnInit {
  private adminService = inject(AdminService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);

  nodes = signal<AdminNodeWithUser[]>([]);
  health = signal<NetworkHealthOverview | null>(null);
  meta = signal<PaginationMeta | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  exporting = signal(false);

  // Filter state
  searchQuery = '';
  statusFilter: 'healthy' | 'jailed' | 'offline' | 'all' = 'all';
  gpuFilter = '';
  sortBy: 'earnings' | 'user' | 'createdAt' = 'createdAt';
  currentPage = 1;

  private searchDebounce = createDebounce();

  ngOnInit(): void {
    // Read initial filter from query params
    this.route.queryParams.subscribe((params) => {
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

  loadHealth(): void {
    this.adminService.getNetworkHealth().subscribe({
      next: (health) => this.health.set(health),
      error: () => {}, // Silent fail for health stats
    });
  }

  loadNodes(): void {
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

    this.adminService.getAllNodes(query).subscribe({
      next: (response) => {
        this.nodes.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load nodes');
        this.loading.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.searchDebounce(() => {
      this.currentPage = 1;
      this.loadNodes();
    }, 300);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadNodes();
  }

  getTruncatedAddress = truncateAddress;
  getStatusVariant = getNodeStatusVariant;

  copyAddress(address: string): void {
    navigator.clipboard.writeText(address).then(() => {
      this.notification.success('Address copied to clipboard');
    });
  }

  exportToCsv(): void {
    this.exporting.set(true);
    this.adminService.exportNodes().subscribe({
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
