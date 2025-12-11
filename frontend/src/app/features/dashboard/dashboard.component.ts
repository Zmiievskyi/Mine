import { Component, OnInit, signal, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NodesService } from '../../core/services/nodes.service';
import { StorageService } from '../../core/services/storage.service';
import { KycService } from '../../core/services/kyc.service';
import { DashboardData, Node } from '../../core/models/node.model';
import { KycStatus } from '../../core/models/kyc.model';
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
  imports: [RouterLink, LayoutComponent, LoadingSpinnerComponent, HlmButton, HlmCardImports, HlmTableImports, HlmBadge],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly nodesService = inject(NodesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(StorageService);
  private readonly kycService = inject(KycService);

  protected readonly loading = signal(true);
  protected readonly refreshing = signal(false);
  protected readonly nodes = signal<Node[]>([]);
  protected readonly stats = signal<DashboardData['stats'] | null>(null);
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly onboardingDismissed = signal(false);
  protected readonly kycStatus = signal<KycStatus>('not_submitted');

  public ngOnInit(): void {
    // Check if onboarding was dismissed
    const dismissed = this.storage.get('minegnk_onboarding_dismissed');
    if (dismissed === 'true') {
      this.onboardingDismissed.set(true);
    }
    this.fetchKycStatus();
    this.startAutoRefresh();
  }

  private fetchKycStatus(): void {
    this.kycService
      .getKycStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.kycStatus.set(response.status);
        },
        error: () => {
          // Keep default 'not_submitted' status on error
        },
      });
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

  protected manualRefresh(): void {
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

  protected getSecondsAgo(): number {
    const last = this.lastUpdated();
    if (!last) return 0;
    return Math.floor((Date.now() - last.getTime()) / 1000);
  }

  // Onboarding checklist methods
  protected showOnboarding(): boolean {
    // Show onboarding if: not dismissed AND user has no nodes
    return !this.onboardingDismissed() && this.nodes().length === 0;
  }

  protected dismissOnboarding(): void {
    this.onboardingDismissed.set(true);
    this.storage.set('minegnk_onboarding_dismissed', 'true');
  }

  protected getOnboardingProgress(): number {
    // 6 steps total: create account (done), sign in (done), complete KYC, request node, wait, start earning
    // First 2 are always complete (user is logged in)
    let completedSteps = 2;
    if (this.kycStatus() === 'verified') completedSteps++;
    if (this.nodes().length > 0) completedSteps++;
    return Math.round((completedSteps / 6) * 100);
  }

  protected isKycComplete(): boolean {
    return this.kycStatus() === 'verified';
  }

  protected isKycPending(): boolean {
    return this.kycStatus() === 'pending';
  }

  protected isKycRejected(): boolean {
    return this.kycStatus() === 'rejected';
  }

  protected readonly getTruncatedAddress = truncateAddress;
  protected readonly getNodeStatusVariant = getNodeStatusVariant;
}
