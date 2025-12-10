import { WritableSignal } from '@angular/core';

/**
 * Handles API errors by extracting message and updating signals
 *
 * @param err - The error object from HTTP request
 * @param fallbackMessage - Default message if error doesn't contain one
 * @param errorSignal - Signal to update with error message
 * @param loadingSignal - Optional loading signal to set to false
 *
 * @example
 * ```typescript
 * this.service.getData().subscribe({
 *   next: (data) => this.data.set(data),
 *   error: (err) => handleApiError(err, 'Failed to load data', this.error, this.loading)
 * });
 * ```
 */
export function handleApiError(
  err: unknown,
  fallbackMessage: string,
  errorSignal: WritableSignal<string | null>,
  loadingSignal?: WritableSignal<boolean>
): void {
  const message = extractErrorMessage(err, fallbackMessage);
  errorSignal.set(message);
  loadingSignal?.set(false);
}

/**
 * Extracts error message from various error formats
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const errorObj = err as Record<string, unknown>;

    // Handle { error: { message: '...' } } format
    if (errorObj['error'] && typeof errorObj['error'] === 'object') {
      const innerError = errorObj['error'] as Record<string, unknown>;
      if (typeof innerError['message'] === 'string') {
        return innerError['message'];
      }
    }

    // Handle { message: '...' } format
    if (typeof errorObj['message'] === 'string') {
      return errorObj['message'];
    }
  }

  return fallback;
}
