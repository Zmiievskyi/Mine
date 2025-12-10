import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NodesService } from '../../../core/services/nodes.service';
import { Node } from '../../../core/models/node.model';
import { ErrorAlertComponent, LayoutComponent, LoadingSpinnerComponent } from '../../../shared/components';
import { getNodeStatusVariant, truncateAddress, getUptimeBarClass, getRateClass } from '../../../shared/utils';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-nodes-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ErrorAlertComponent,
    LayoutComponent,
    LoadingSpinnerComponent,
    HlmTableImports,
    HlmBadge,
    HlmButton
  ],
  template: `
    <app-layout>
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-[var(--gcore-text)]">My Nodes</h1>
          <p class="text-[var(--gcore-text-muted)] mt-1">
            Monitor your GPU nodes and track earnings
          </p>
        </div>
        <a routerLink="/nodes/request" hlmBtn>
          Request New Node
        </a>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12">
          <app-loading-spinner message="Loading nodes..." />
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <app-error-alert
          [message]="error()!"
          [title]="'Failed to load nodes'"
          (retry)="loadNodes()"
        />
      }

      <!-- Nodes Table -->
      @if (!loading() && !error()) {
        <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)]">
          @if (nodes().length === 0) {
            <div class="p-12 text-center">
              <div class="text-4xl mb-4 opacity-50">&#128187;</div>
              <h3 class="text-lg font-medium text-[var(--gcore-text)] mb-2">
                No nodes yet
              </h3>
              <p class="text-[var(--gcore-text-muted)] mb-4">
                Request your first GPU node to start mining GNK tokens.
              </p>
              <a routerLink="/nodes/request" hlmBtn>
                Request Node
              </a>
            </div>
          } @else {
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmThead>
                  <tr hlmTr>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">Node</th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">Status</th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">GPU Type</th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">Performance</th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">Earnings</th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">Uptime</th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">Missed</th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">Invalid</th>
                    <th hlmTh class="text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody hlmTbody>
                  @for (node of nodes(); track node.id) {
                    <tr hlmTr [class.bg-red-50]="isProblematicNode(node)">
                      <td hlmTd>
                        <div>
                          <a
                            [routerLink]="['/nodes', node.address]"
                            class="text-primary hover:underline font-medium"
                          >
                            {{ node.alias || 'Node ' + truncateAddress(node.address, 8) }}
                          </a>
                          <p class="text-xs text-muted-foreground mt-1 font-mono">
                            {{ truncateAddress(node.address) }}
                          </p>
                        </div>
                      </td>
                      <td hlmTd>
                        <span
                          hlmBadge
                          [variant]="getStatusVariant(node.status)"
                        >
                          {{ node.status }}
                        </span>
                        @if (node.isJailed) {
                          <span class="ml-2 text-xs text-destructive">(jailed)</span>
                        }
                      </td>
                      <td hlmTd>{{ node.gpuType }}</td>
                      <td hlmTd>
                        <div>{{ node.tokensPerSecond.toFixed(2) }} tok/s</div>
                        <div class="text-xs text-muted-foreground">{{ node.jobsCompleted }} jobs</div>
                      </td>
                      <td hlmTd>
                        <span class="text-primary font-medium">{{ node.earnedCoins.toFixed(2) }} GNK</span>
                      </td>
                      <td hlmTd>
                        <div class="flex items-center gap-2">
                          <div class="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              class="h-full rounded-full"
                              [class]="getUptimeBarClass(node.uptimePercent)"
                              [style.width.%]="node.uptimePercent"
                            ></div>
                          </div>
                          <span class="text-sm">{{ node.uptimePercent.toFixed(0) }}%</span>
                        </div>
                      </td>
                      <td hlmTd>
                        <span [class]="getRateClass(node.missedRate || 0)">
                          {{ ((node.missedRate || 0) * 100).toFixed(1) }}%
                        </span>
                      </td>
                      <td hlmTd>
                        <span [class]="getRateClass(node.invalidationRate || 0)">
                          {{ ((node.invalidationRate || 0) * 100).toFixed(1) }}%
                        </span>
                      </td>
                      <td hlmTd>
                        <a
                          [routerLink]="['/nodes', node.address]"
                          class="text-primary hover:underline text-sm"
                        >
                          View Details
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Summary Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-[var(--gcore-border)]">
              <div class="flex items-center justify-between text-sm">
                <span class="text-[var(--gcore-text-muted)]">
                  {{ nodes().length }} node(s) total
                </span>
                <span class="text-[var(--gcore-text)]">
                  Total Earnings:
                  <span class="font-medium text-[var(--gcore-primary)]">
                    {{ getTotalEarnings().toFixed(2) }} GNK
                  </span>
                </span>
              </div>
            </div>
          }
        </div>
      }
    </app-layout>
  `,
})
export class NodesListComponent implements OnInit {
  private nodesService = inject(NodesService);
  private destroyRef = inject(DestroyRef);

  nodes = signal<Node[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadNodes();
  }

  loadNodes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.nodesService
      .getNodes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nodes) => {
          this.nodes.set(nodes);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load nodes');
          this.loading.set(false);
        },
      });
  }

  // Assign utility functions for template access
  getStatusVariant = getNodeStatusVariant;
  truncateAddress = truncateAddress;
  getUptimeBarClass = getUptimeBarClass;
  getRateClass = getRateClass;

  getTotalEarnings(): number {
    return this.nodes().reduce((sum, node) => sum + node.earnedCoins, 0);
  }

  // Check if node has problems (>10% missed or invalid rate, or jailed)
  isProblematicNode(node: Node): boolean {
    return (
      (node.missedRate || 0) > 0.1 ||
      (node.invalidationRate || 0) > 0.1 ||
      node.isJailed
    );
  }
}
