import { Component, OnInit, signal, inject, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith, switchMap } from 'rxjs';
import { NodesService } from '../../core/services/nodes.service';
import { DashboardData, Node } from '../../core/models/node.model';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { getNodeStatusVariant } from '../../shared/utils/node-status.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LayoutComponent, LoadingSpinnerComponent, HlmButton, HlmCardImports, HlmTableImports, HlmBadge],
  template: `
    <app-layout>
      <!-- Header with Refresh -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[var(--gcore-text)]">Dashboard</h1>
        <div class="flex items-center gap-4">
          @if (lastUpdated()) {
            <span class="text-sm text-[var(--gcore-text-muted)]">
              Updated {{ getSecondsAgo() }}s ago
            </span>
          }
          <button
            hlmBtn
            variant="outline"
            size="sm"
            (click)="manualRefresh()"
            [disabled]="refreshing()"
            class="flex items-center gap-2"
          >
            @if (refreshing()) {
              <span class="inline-block w-4 h-4 border-2 border-[var(--gcore-primary)] border-t-transparent rounded-full animate-spin"></span>
            }
            Refresh
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-12">
          <app-loading-spinner message="Loading dashboard..." />
        </div>
      } @else {
        <!-- Onboarding Checklist (for new users) -->
        @if (showOnboarding()) {
          <div class="bg-gradient-to-r from-[var(--gcore-primary)]/10 to-orange-50 border border-[var(--gcore-primary)]/20 rounded-lg p-6 mb-6">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-1">
                  Get Started with MineGNK
                </h2>
                <p class="text-sm text-[var(--gcore-text-muted)]">
                  Complete these steps to start earning GNK tokens
                </p>
              </div>
              <button
                (click)="dismissOnboarding()"
                class="text-[var(--gcore-text-muted)] hover:text-[var(--gcore-text)] text-xl leading-none"
                title="Dismiss"
              >
                &times;
              </button>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4 mb-4">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-[var(--gcore-text-muted)]">Progress</span>
                <span class="font-medium text-[var(--gcore-primary)]">{{ getOnboardingProgress() }}%</span>
              </div>
              <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-[var(--gcore-primary)] rounded-full transition-all duration-300"
                  [style.width.%]="getOnboardingProgress()"
                ></div>
              </div>
            </div>

            <!-- Checklist Items -->
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm">✓</span>
                <span class="text-[var(--gcore-text)] line-through opacity-60">Create your account</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm">✓</span>
                <span class="text-[var(--gcore-text)] line-through opacity-60">Sign in to dashboard</span>
              </div>
              <div class="flex items-center gap-3">
                @if (nodes().length > 0) {
                  <span class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm">✓</span>
                  <span class="text-[var(--gcore-text)] line-through opacity-60">Request your first node</span>
                } @else {
                  <span class="w-6 h-6 rounded-full border-2 border-[var(--gcore-primary)] text-[var(--gcore-primary)] flex items-center justify-center text-sm font-bold">3</span>
                  <a routerLink="/nodes/request" class="text-[var(--gcore-primary)] hover:underline font-medium">
                    Request your first node →
                  </a>
                }
              </div>
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full border-2 border-gray-300 text-gray-400 flex items-center justify-center text-sm">4</span>
                <span class="text-[var(--gcore-text-muted)]">Wait for node assignment (24-48h)</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full border-2 border-gray-300 text-gray-400 flex items-center justify-center text-sm">5</span>
                <span class="text-[var(--gcore-text-muted)]">Start earning GNK!</span>
              </div>
            </div>
          </div>
        }

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <section hlmCard>
            <div hlmCardContent class="p-6">
              <p class="text-sm text-[var(--gcore-text-muted)]">Active Nodes</p>
              <p class="text-2xl font-bold text-[var(--gcore-text)]">
                {{ stats()?.totalNodes || 0 }}
              </p>
            </div>
          </section>
          <section hlmCard>
            <div hlmCardContent class="p-6">
              <p class="text-sm text-[var(--gcore-text-muted)]">Healthy Nodes</p>
              <p class="text-2xl font-bold text-green-600">
                {{ stats()?.healthyNodes || 0 }}
              </p>
            </div>
          </section>
          <section hlmCard>
            <div hlmCardContent class="p-6">
              <p class="text-sm text-[var(--gcore-text-muted)]">Total Earnings</p>
              <p class="text-2xl font-bold text-[var(--gcore-primary)]">
                {{ stats()?.totalEarnings?.toFixed(2) || '0.00' }} GNK
              </p>
            </div>
          </section>
          <section hlmCard>
            <div hlmCardContent class="p-6">
              <p class="text-sm text-[var(--gcore-text-muted)]">Avg Uptime</p>
              <p class="text-2xl font-bold text-[var(--gcore-text)]">
                {{ stats()?.averageUptime?.toFixed(1) || '0' }}%
              </p>
            </div>
          </section>
        </div>

        <!-- Nodes Table -->
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)]">
          <div class="px-6 py-4 border-b border-[var(--gcore-border)] flex items-center justify-between">
            <h2 class="font-semibold text-[var(--gcore-text)]">Your Nodes</h2>
            <a routerLink="/nodes" class="text-sm text-[var(--gcore-primary)] hover:underline">
              View All
            </a>
          </div>
          @if (nodes().length === 0) {
            <div class="p-6 text-center text-[var(--gcore-text-muted)]">
              <p>No nodes yet.</p>
              <a routerLink="/nodes/request" class="text-[var(--gcore-primary)] hover:underline">
                Request your first node
              </a>
            </div>
          } @else {
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmThead>
                  <tr hlmTr>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">
                      Node
                    </th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">
                      GPU
                    </th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">
                      Earnings
                    </th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">
                      Uptime
                    </th>
                  </tr>
                </thead>
                <tbody hlmTbody>
                  @for (node of nodes(); track node.id) {
                    <tr hlmTr>
                      <td hlmTd>
                        <a
                          [routerLink]="['/nodes', node.address]"
                          class="text-primary hover:underline font-medium"
                        >
                          {{ node.alias || node.address.slice(0, 12) + '...' }}
                        </a>
                      </td>
                      <td hlmTd>
                        <span hlmBadge [variant]="getNodeStatusVariant(node.status)">
                          {{ node.status }}
                        </span>
                      </td>
                      <td hlmTd>
                        {{ node.gpuType }}
                      </td>
                      <td hlmTd>
                        <span class="text-primary font-medium">{{ node.earnedCoins.toFixed(2) }} GNK</span>
                      </td>
                      <td hlmTd>
                        {{ node.uptimePercent.toFixed(1) }}%
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </app-layout>
  `,
})
export class DashboardComponent implements OnInit {
  private nodesService = inject(NodesService);
  private destroyRef = inject(DestroyRef);

  // Auto-refresh interval (30 seconds)
  private readonly REFRESH_INTERVAL = 30000;

  loading = signal(true);
  refreshing = signal(false);
  nodes = signal<Node[]>([]);
  stats = signal<DashboardData['stats'] | null>(null);
  lastUpdated = signal<Date | null>(null);
  onboardingDismissed = signal(false);

  ngOnInit(): void {
    // Check if onboarding was dismissed
    const dismissed = localStorage.getItem('minegnk_onboarding_dismissed');
    if (dismissed === 'true') {
      this.onboardingDismissed.set(true);
    }
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    interval(this.REFRESH_INTERVAL)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (!this.loading()) {
            this.refreshing.set(true);
          }
          return this.nodesService.getDashboardData();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
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
    localStorage.setItem('minegnk_onboarding_dismissed', 'true');
  }

  getOnboardingProgress(): number {
    // 5 steps total: create account (done), sign in (done), request node, wait, start earning
    // First 2 are always complete (user is logged in)
    const completedSteps = 2 + (this.nodes().length > 0 ? 1 : 0);
    return Math.round((completedSteps / 5) * 100);
  }

  getNodeStatusVariant = getNodeStatusVariant;
}
