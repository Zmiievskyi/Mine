import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NodesService } from '../../../core/services/nodes.service';
import { NodeDetail } from '../../../core/models/node.model';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { NodeDetailOverviewComponent } from './node-detail-overview/node-detail-overview.component';
import { NodeDetailMetricsComponent } from './node-detail-metrics/node-detail-metrics.component';
import { NodeDetailHistoryComponent } from './node-detail-history/node-detail-history.component';
import { getNodeStatusVariant, truncateAddress, handleApiError } from '../../../shared/utils';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { BrnTabsImports } from '@spartan-ng/brain/tabs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';

@Component({
  selector: 'app-node-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LayoutComponent,
    LoadingSpinnerComponent,
    NodeDetailOverviewComponent,
    NodeDetailMetricsComponent,
    NodeDetailHistoryComponent,
    BrnTabsImports,
    HlmTabsImports,
    HlmButton,
    HlmBadge,
  ],
  templateUrl: './node-detail.component.html',
})
export class NodeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private nodesService = inject(NodesService);
  private destroyRef = inject(DestroyRef);

  node = signal<NodeDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  private nodeAddress: string = '';

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.nodeAddress = params['id'];
        this.loadNode();
      });
  }

  loadNode(): void {
    if (!this.nodeAddress) return;

    this.loading.set(true);
    this.error.set(null);

    this.nodesService
      .getNode(this.nodeAddress)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (node) => {
          if (node) {
            this.node.set(node);
          } else {
            this.error.set('Node not found or access denied');
          }
          this.loading.set(false);
        },
        error: (err) => handleApiError(err, 'Failed to load node details', this.error, this.loading),
      });
  }

  getNodeStatusVariant = getNodeStatusVariant;
  truncateAddress = truncateAddress;
}
