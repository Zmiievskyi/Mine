import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [],
  template: `
    <div class="flex flex-col items-center justify-center" [class]="containerClass">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gcore-primary)] mb-4"></div>
      @if (message) {
        <p class="text-[var(--gcore-text-muted)]">{{ message }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  @Input() message: string | null = 'Loading...';
  @Input() containerClass = '';
}
