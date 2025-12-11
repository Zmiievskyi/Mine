import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NodeDetail } from '../../../../core/models/node.model';

@Component({
  selector: 'app-node-detail-metrics',
  standalone: true,
  imports: [],
  templateUrl: './node-detail-metrics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeDetailMetricsComponent {
  protected readonly Math = Math;

  @Input({ required: true }) public node!: NodeDetail;
}
