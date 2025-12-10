/**
 * Pricing validation constants
 *
 * Defines validation limits for GPU pricing to prevent data entry errors.
 * These limits are not business rules but safety guardrails.
 */

/**
 * Minimum hourly price in EUR
 * Set to 0 to allow free-tier or promotional pricing
 */
export const MIN_HOURLY_PRICE_EUR = 0;

/**
 * Maximum hourly price in EUR
 * Safety limit to prevent accidental data entry errors (e.g., entering 1000 instead of 10.00)
 * Based on current market rates for high-end datacenter GPUs (H100/H200)
 */
export const MAX_HOURLY_PRICE_EUR = 100;
