import { WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { downloadBlobWithDate } from './download.util';
import { NotificationService } from '../../core/services/notification.service';

/**
 * Creates a reusable CSV export handler with loading state and error handling
 *
 * @param exportingSignal - Signal to track export loading state
 * @param exportFn - Observable that returns the blob to download
 * @param fileName - Base name for the downloaded file (without extension or timestamp)
 * @param notificationService - Service to show error notifications
 * @returns Function that triggers the export when called
 *
 * @example
 * ```typescript
 * exporting = signal(false);
 * exportToCsv = createExportHandler(
 *   this.exporting,
 *   () => this.adminService.exportUsers(),
 *   'users',
 *   this.notification
 * );
 * ```
 */
export function createExportHandler(
  exportingSignal: WritableSignal<boolean>,
  exportFn: () => Observable<Blob>,
  fileName: string,
  notificationService: NotificationService
): () => void {
  return () => {
    exportingSignal.set(true);
    exportFn().subscribe({
      next: (blob) => {
        downloadBlobWithDate(blob, fileName);
        exportingSignal.set(false);
      },
      error: () => {
        notificationService.error(`Failed to export ${fileName}`);
        exportingSignal.set(false);
      },
    });
  };
}
