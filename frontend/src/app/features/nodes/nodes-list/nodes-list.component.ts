import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NodesService } from '../../../core/services/nodes.service';
import { Node } from '../../../core/models/node.model';
import { ErrorAlertComponent, LayoutComponent, LoadingSpinnerComponent } from '../../../shared/components';
import { getNodeStatusVariant, truncateAddress, getUptimeBarClass, getRateClass, handleApiError } from '../../../shared/utils';
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
  templateUrl: './nodes-list.component.html',
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
        error: (err) => handleApiError(err, 'Failed to load nodes', this.error, this.loading),
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
