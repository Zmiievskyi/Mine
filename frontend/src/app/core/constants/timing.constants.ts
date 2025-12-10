/**
 * Timing constants for auto-refresh and debounce operations
 */
export const REFRESH_INTERVALS = {
  /** Dashboard auto-refresh interval (30 seconds) */
  DASHBOARD: 30_000,
  /** Landing page stats refresh interval (60 seconds) */
  LANDING_STATS: 60_000,
} as const;

export const DEBOUNCE_DELAYS = {
  /** Search input debounce delay */
  SEARCH: 300,
} as const;
