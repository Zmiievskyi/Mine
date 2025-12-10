import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDetail } from '../../../../core/models/node.model';

@Component({
  selector: 'app-node-detail-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './node-detail-metrics.component.html',
})
export class NodeDetailMetricsComponent {
  readonly Math = Math;

  @Input({ required: true }) node!: NodeDetail;
}
