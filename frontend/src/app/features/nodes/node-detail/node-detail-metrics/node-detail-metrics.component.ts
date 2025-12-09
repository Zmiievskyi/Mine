import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDetail } from '../../../../core/models/node.model';

@Component({
  selector: 'app-node-detail-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
        <p class="text-sm text-[var(--gcore-text-muted)]">Inference Count</p>
        <p class="text-2xl font-bold text-[var(--gcore-text)]">
          {{ node.inferenceCount?.toLocaleString() || 0 }}
        </p>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
        <p class="text-sm text-[var(--gcore-text-muted)]">Missed Jobs</p>
        <p class="text-2xl font-bold text-[var(--gcore-text)]">
          {{ node.missedCount || 0 }}
        </p>
        <p class="text-sm text-[var(--gcore-text-muted)]">
          {{ (node.missedRate || 0).toFixed(2) }}% rate
        </p>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
        <p class="text-sm text-[var(--gcore-text-muted)]">Invalidation Rate</p>
        <p class="text-2xl font-bold text-[var(--gcore-text)]">
          {{ (node.invalidationRate || 0).toFixed(2) }}%
        </p>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
        <p class="text-sm text-[var(--gcore-text-muted)]">Uptime</p>
        <p class="text-2xl font-bold text-[var(--gcore-text)]">
          {{ node.uptimePercent?.toFixed(0) || 0 }}%
        </p>
      </div>
    </div>

    <!-- Performance Details -->
    <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
      <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">Performance Details</h2>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-[var(--gcore-text-muted)]">Inference Rate</span>
            <span class="text-[var(--gcore-text)]">{{ node.tokensPerSecond?.toFixed(2) || 0 }} tok/s</span>
          </div>
          <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-[var(--gcore-primary)] rounded-full"
              [style.width.%]="Math.min((node.tokensPerSecond || 0) * 10, 100)"
            ></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-[var(--gcore-text-muted)]">Success Rate</span>
            <span class="text-[var(--gcore-text)]">{{ (100 - (node.missedRate || 0)).toFixed(1) }}%</span>
          </div>
          <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-green-500 rounded-full"
              [style.width.%]="100 - (node.missedRate || 0)"
            ></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-[var(--gcore-text-muted)]">Network Weight</span>
            <span class="text-[var(--gcore-text)]">{{ (node.weight || 0).toFixed(6) }}</span>
          </div>
          <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 rounded-full"
              [style.width.%]="Math.min((node.weight || 0) * 10000, 100)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NodeDetailMetricsComponent {
  readonly Math = Math;

  @Input({ required: true }) node!: NodeDetail;
}
