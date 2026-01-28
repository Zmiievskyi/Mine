/**
 * Pricing validation constants
 *
 * Defines validation limits for GPU pricing to prevent data entry errors.
 * These limits are not business rules but safety guardrails.
 * Currency: USD (prices from gnk.revops.it.com)
 */

/**
 * Minimum hourly price in USD
 * Set to 0 to allow free-tier or promotional pricing
 */
export const MIN_HOURLY_PRICE_USD = 0;

/**
 * Maximum hourly price in USD
 * Safety limit to prevent accidental data entry errors (e.g., entering 1000 instead of 10.00)
 * Based on current market rates for high-end datacenter GPUs (B200 = $3.50/hr)
 */
export const MAX_HOURLY_PRICE_USD = 100;
