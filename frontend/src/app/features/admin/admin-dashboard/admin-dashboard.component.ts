import { Component, OnInit, signal, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { AdminDashboardStats, NetworkHealthOverview } from '../../../core/models/admin.model';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, LayoutComponent, HlmCardImports],
  templateUrl: './admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  protected readonly stats = signal<AdminDashboardStats>({
    totalUsers: 0,
    totalNodes: 0,
    pendingRequests: 0,
    approvedRequests: 0,
  });

  protected readonly networkHealth = signal<NetworkHealthOverview>({
    totalNodes: 0,
    healthyNodes: 0,
    jailedNodes: 0,
    offlineNodes: 0,
    unknownNodes: 0,
    totalEarnings: '0',
  });

  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  public ngOnInit(): void {
    forkJoin({
      stats: this.adminService.getDashboardStats(),
      health: this.adminService.getNetworkHealth(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ stats, health }) => {
          this.stats.set(stats);
          this.networkHealth.set(health);
        },
        error: () => {},
      });
  }
}
