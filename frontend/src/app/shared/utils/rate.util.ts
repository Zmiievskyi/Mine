/**
 * Get Tailwind CSS class for uptime progress bar based on percentage
 * @param uptime - Uptime percentage (0-100)
 * @returns Tailwind background color class
 * @example getUptimeBarClass(95) // 'bg-green-500'
 */
export function getUptimeBarClass(uptime: number): string {
  if (uptime >= 90) return 'bg-green-500';
  if (uptime >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Get Tailwind CSS class for rate display based on threshold
 * Used for missed rate and invalidation rate columns
 * @param rate - Rate as decimal (0.1 = 10%)
 * @returns Tailwind text color class
 * @example getRateClass(0.15) // 'text-destructive font-medium'
 */
export function getRateClass(rate: number): string {
  if (rate > 0.1) return 'text-destructive font-medium';
  if (rate > 0.05) return 'text-yellow-600';
  return 'text-muted-foreground';
}
