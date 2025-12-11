import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-node-detail-history',
  standalone: true,
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12 text-center">
      <div class="text-4xl mb-4 opacity-50">&#128200;</div>
      <h3 class="text-lg font-medium text-[var(--gcore-text)] mb-2">
        Earnings History Coming Soon
      </h3>
      <p class="text-[var(--gcore-text-muted)] max-w-md mx-auto">
        Historical earnings data and status timeline will be available in a future update.
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeDetailHistoryComponent {}
