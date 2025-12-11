import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NodeDetail } from '../../../../core/models/node.model';
import { getNodeStatusVariant } from '../../../../shared/utils';
import { HlmBadge } from '@spartan-ng/helm/badge';

@Component({
  selector: 'app-node-detail-overview',
  standalone: true,
  imports: [HlmBadge],
  templateUrl: './node-detail-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeDetailOverviewComponent {
  @Input({ required: true }) public node!: NodeDetail;
  protected readonly getNodeStatusVariant = getNodeStatusVariant;
}
