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
  templateUrl: './admin-dashboard.component.html',
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
