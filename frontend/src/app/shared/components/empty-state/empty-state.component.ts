import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12 text-center">
      <div class="text-4xl mb-4 opacity-50">{{ icon }}</div>
      <h3 class="text-lg font-medium text-[var(--gcore-text)] mb-2">{{ title }}</h3>
      <p class="text-[var(--gcore-text-muted)] mb-6 max-w-md mx-auto">{{ description }}</p>
      <ng-content></ng-content>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'No data';
  @Input() description = '';
}
