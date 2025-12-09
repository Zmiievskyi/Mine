import { DestroyRef } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Creates an auto-refresh observable that fetches data at regular intervals
 *
 * This utility encapsulates the common pattern of:
 * - Fetching data immediately on subscription (startWith(0))
 * - Polling at regular intervals (interval)
 * - Switching to new data stream on each tick (switchMap)
 * - Automatic cleanup on component destruction (takeUntilDestroyed)
 *
 * @param intervalMs - Refresh interval in milliseconds (e.g., 30000 for 30 seconds)
 * @param dataSource - Function that returns the data observable to fetch
 * @param destroyRef - Angular DestroyRef for automatic cleanup
 * @returns Observable that emits data on initial load and at regular intervals
 *
 * @example
 * ```typescript
 * createAutoRefresh(30000, () => this.service.getData(), this.destroyRef)
 *   .subscribe({
 *     next: (data) => this.data.set(data),
 *     error: (err) => console.error(err)
 *   });
 * ```
 */
export function createAutoRefresh<T>(
  intervalMs: number,
  dataSource: () => Observable<T>,
  destroyRef: DestroyRef
): Observable<T> {
  return interval(intervalMs).pipe(
    startWith(0),
    switchMap(() => dataSource()),
    takeUntilDestroyed(destroyRef)
  );
}
