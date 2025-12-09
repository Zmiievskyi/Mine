import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDetail } from '../../../../core/models/node.model';
import { getNodeStatusVariant } from '../../../../shared/utils/node-status.util';
import { HlmBadge } from '@spartan-ng/helm/badge';

@Component({
  selector: 'app-node-detail-overview',
  standalone: true,
  imports: [CommonModule, HlmBadge],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Info Card -->
      <div class="lg:col-span-2 bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
        <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">Node Information</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-[var(--gcore-text-muted)]">GPU Type</p>
            <p class="text-[var(--gcore-text)] font-medium">{{ node.gpuType }}</p>
          </div>
          <div>
            <p class="text-sm text-[var(--gcore-text-muted)]">Status</p>
            <div class="flex items-center gap-2">
              <span hlmBadge [variant]="getNodeStatusVariant(node.status || 'offline')">
                {{ node.status }}
              </span>
              @if (node.isJailed) {
                <span hlmBadge variant="destructive">Jailed</span>
              }
              @if (node.isBlacklisted) {
                <span hlmBadge variant="destructive">Blacklisted</span>
              }
            </div>
          </div>
          <div>
            <p class="text-sm text-[var(--gcore-text-muted)]">Network Weight</p>
            <p class="text-[var(--gcore-text)] font-medium">{{ (node.weight || 0).toFixed(4) }}</p>
          </div>
          <div>
            <p class="text-sm text-[var(--gcore-text-muted)]">Blocks Claimed</p>
            <p class="text-[var(--gcore-text)] font-medium">{{ node.blocksClaimed || 0 }}</p>
          </div>
        </div>

        <!-- Models Section -->
        <div class="mt-6 pt-6 border-t border-[var(--gcore-border)]">
          <h3 class="text-sm font-medium text-[var(--gcore-text)] mb-3">Active Models</h3>
          @if (node.models && node.models.length > 0) {
            <div class="flex flex-wrap gap-2">
              @for (model of node.models; track model) {
                <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {{ model }}
                </span>
              }
            </div>
          } @else {
            <p class="text-[var(--gcore-text-muted)] text-sm">No models active</p>
          }
        </div>
      </div>

      <!-- Earnings Card -->
      <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-6">
        <h2 class="text-lg font-semibold text-[var(--gcore-text)] mb-4">Earnings</h2>
        <div class="text-center py-4">
          <p class="text-4xl font-bold text-[var(--gcore-primary)]">
            {{ (node.earnedCoins || 0).toFixed(2) }}
          </p>
          <p class="text-[var(--gcore-text-muted)] mt-1">GNK Earned</p>
        </div>
        <div class="mt-4 pt-4 border-t border-[var(--gcore-border)]">
          <div class="flex justify-between items-center">
            <span class="text-sm text-[var(--gcore-text-muted)]">Performance</span>
            <span class="font-medium text-[var(--gcore-text)]">
              {{ (node.tokensPerSecond || 0).toFixed(2) }} tok/s
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NodeDetailOverviewComponent {
  @Input({ required: true }) node!: NodeDetail;
  protected readonly getNodeStatusVariant = getNodeStatusVariant;
}
