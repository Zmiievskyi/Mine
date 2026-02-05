// Gonka Network API Configuration

const FALLBACK_API_URL = 'http://202.78.161.32:8000';

/** Base URL for Gonka API - can be overridden via environment variable */
export const GONKA_API_BASE = (() => {
  const url = process.env.GONKA_API_URL;
  if (!url && process.env.NODE_ENV === 'production') {
    console.warn(
      '[Gonka API] GONKA_API_URL environment variable not set in production. Using fallback IP address.'
    );
  }
  return url || FALLBACK_API_URL;
})();

/** API endpoints */
export const GONKA_ENDPOINTS = {
  participants: `${GONKA_API_BASE}/v1/epochs/current/participants`,
  hardwareNodes: `${GONKA_API_BASE}/chain-api/productscience/inference/inference/hardware_nodes_all`,
  chainStatus: `${GONKA_API_BASE}/chain-rpc/status`,
} as const;

/** Request timeout in milliseconds */
export const FETCH_TIMEOUT_MS = 5000;

/** Minimum POC weight to consider a node active/valid */
export const MIN_POC_WEIGHT_THRESHOLD = 100;

/** Block age threshold for "fresh" status (seconds) */
export const FRESH_BLOCK_THRESHOLD = 120;

/** Cache duration for GPU weights (seconds) */
export const GPU_WEIGHTS_CACHE_DURATION = 60;

/** GPU pricing (per GPU per hour in USD) */
export const GPU_PRICING: Record<string, number> = {
  A100: 0.99,
  H100: 1.8,
  H200: 2.4,
  B200: 3.02,
};
