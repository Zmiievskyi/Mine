import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';

/**
 * Reusable error alert component with optional retry button.
 *
 * Displays error messages in a consistent red-themed alert box.
 * Used across the app for API errors, loading failures, etc.
 *
 * @example
 * <app-error-alert
 *   [message]="errorMessage()"
 *   [title]="'Failed to Load'"
 *   [showRetry]="true"
 *   (retry)="handleRetry()" />
 */
@Component({
  selector: 'app-error-alert',
  standalone: true,
  imports: [HlmButton],
  template: `
    <div class="bg-red-50 border border-red-200 rounded-lg p-6">
      <div class="flex items-center gap-3">
        <span class="text-red-600 text-xl">⚠</span>
        <div>
          <h3 class="font-medium text-red-800">{{ title() }}</h3>
          <p class="text-red-600 text-sm mt-1">{{ message() }}</p>
        </div>
      </div>
      @if (showRetry()) {
        <button
          hlmBtn
          variant="destructive"
          (click)="retry.emit()"
          class="mt-4">
          Retry
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorAlertComponent {
  /** Error message to display (required) */
  public readonly message = input.required<string>();

  /** Alert title (defaults to "Error") */
  public readonly title = input<string>('Error');

  /** Whether to show retry button (defaults to true) */
  public readonly showRetry = input<boolean>(true);

  /** Emits when retry button is clicked */
  public readonly retry = output<void>();
}
