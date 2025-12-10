import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDetail } from '../../../../core/models/node.model';
import { getNodeStatusVariant } from '../../../../shared/utils';
import { HlmBadge } from '@spartan-ng/helm/badge';

@Component({
  selector: 'app-node-detail-overview',
  standalone: true,
  imports: [CommonModule, HlmBadge],
  templateUrl: './node-detail-overview.component.html',
})
export class NodeDetailOverviewComponent {
  @Input({ required: true }) node!: NodeDetail;
  protected readonly getNodeStatusVariant = getNodeStatusVariant;
}
