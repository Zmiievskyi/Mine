import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12 text-center">
      <div class="text-4xl mb-4">⚠️</div>
      <h3 class="text-lg font-medium text-[var(--gcore-text)] mb-2">{{ title }}</h3>
      <p class="text-[var(--gcore-text-muted)] mb-6">{{ message }}</p>
      @if (showRetry) {
        <button
          (click)="retry.emit()"
          class="px-4 py-2 bg-[var(--gcore-primary)] text-white rounded-lg hover:bg-[var(--gcore-primary-hover)] transition-colors">
          Try Again
        </button>
      }
    </div>
  `
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'Failed to load data. Please try again.';
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
}
