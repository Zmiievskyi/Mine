import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NodesService } from '../../core/services/nodes.service';
import { StorageService } from '../../core/services/storage.service';
import { DashboardData, Node } from '../../core/models/node.model';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { getNodeStatusVariant, createAutoRefresh, truncateAddress } from '../../shared/utils';
import { REFRESH_INTERVALS } from '../../core/constants';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LayoutComponent, LoadingSpinnerComponent, HlmButton, HlmCardImports, HlmTableImports, HlmBadge],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private nodesService = inject(NodesService);
  private destroyRef = inject(DestroyRef);
  private storage = inject(StorageService);

  loading = signal(true);
  refreshing = signal(false);
  nodes = signal<Node[]>([]);
  stats = signal<DashboardData['stats'] | null>(null);
  lastUpdated = signal<Date | null>(null);
  onboardingDismissed = signal(false);

  ngOnInit(): void {
    // Check if onboarding was dismissed
    const dismissed = this.storage.get('minegnk_onboarding_dismissed');
    if (dismissed === 'true') {
      this.onboardingDismissed.set(true);
    }
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    createAutoRefresh(
      REFRESH_INTERVALS.DASHBOARD,
      () => {
        if (!this.loading()) {
          this.refreshing.set(true);
        }
        return this.nodesService.getDashboardData();
      },
      this.destroyRef
    ).subscribe({
      next: (data) => {
        this.nodes.set(data.nodes);
        this.stats.set(data.stats);
        this.loading.set(false);
        this.refreshing.set(false);
        this.lastUpdated.set(new Date());
      },
      error: () => {
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });
  }

  manualRefresh(): void {
    this.refreshing.set(true);
    this.nodesService
      .getDashboardData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.nodes.set(data.nodes);
          this.stats.set(data.stats);
          this.refreshing.set(false);
          this.lastUpdated.set(new Date());
        },
        error: () => {
          this.refreshing.set(false);
        },
      });
  }

  getSecondsAgo(): number {
    const last = this.lastUpdated();
    if (!last) return 0;
    return Math.floor((Date.now() - last.getTime()) / 1000);
  }

  // Onboarding checklist methods
  showOnboarding(): boolean {
    // Show onboarding if: not dismissed AND user has no nodes
    return !this.onboardingDismissed() && this.nodes().length === 0;
  }

  dismissOnboarding(): void {
    this.onboardingDismissed.set(true);
    this.storage.set('minegnk_onboarding_dismissed', 'true');
  }

  getOnboardingProgress(): number {
    // 5 steps total: create account (done), sign in (done), request node, wait, start earning
    // First 2 are always complete (user is logged in)
    const completedSteps = 2 + (this.nodes().length > 0 ? 1 : 0);
    return Math.round((completedSteps / 5) * 100);
  }

  getTruncatedAddress = truncateAddress;
  getNodeStatusVariant = getNodeStatusVariant;
}
