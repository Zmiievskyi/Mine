import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-[var(--gcore-border)] p-12">
      <div class="flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gcore-primary)] mb-4"></div>
        <p class="text-[var(--gcore-text-muted)]">{{ message }}</p>
      </div>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() message = 'Loading...';
}
