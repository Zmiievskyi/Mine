/**
 * Utility functions for downloading files in the browser
 */

/**
 * Downloads a Blob as a file in the browser
 * Creates a temporary download link, triggers it, and cleans up
 *
 * @param blob The Blob data to download
 * @param filename The name for the downloaded file
 *
 * @example
 * ```typescript
 * // Download CSV file
 * this.apiService.exportData().subscribe(blob => {
 *   downloadBlob(blob, 'export-data.csv');
 * });
 * ```
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Generates a filename with the current date appended (internal helper)
 * @param prefix The prefix for the filename (e.g., 'users', 'requests')
 * @param extension The file extension (e.g., 'csv', 'json')
 * @returns Filename in format: {prefix}-YYYY-MM-DD.{extension}
 */
function generateDateFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.${extension}`;
}

/**
 * Downloads a Blob with an auto-generated date-stamped filename
 * @param blob The Blob data to download
 * @param prefix The prefix for the filename
 * @param extension The file extension (default: 'csv')
 *
 * @example
 * ```typescript
 * this.apiService.exportUsers().subscribe(blob => {
 *   downloadBlobWithDate(blob, 'users', 'csv');
 *   // Downloads as: users-2025-12-09.csv
 * });
 * ```
 */
export function downloadBlobWithDate(blob: Blob, prefix: string, extension: string = 'csv'): void {
  const filename = generateDateFilename(prefix, extension);
  downloadBlob(blob, filename);
}
