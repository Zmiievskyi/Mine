/**
 * HubSpot URL Parameter Utilities
 * Handles URL parameter manipulation for HubSpot form pre-fill
 */

/**
 * Maps GPU type string to HubSpot-compatible format
 * @param gpuType - GPU type string (e.g., "A100", "H100")
 * @returns Formatted GPU value (e.g., "8 x A100") or null if invalid
 */
export function getHubSpotGpuValue(gpuType: string): string | null {
  const validIds = ['A100', 'H100', 'H200', 'B200'];
  const upperType = gpuType.toUpperCase();

  for (const id of validIds) {
    if (upperType.includes(id)) {
      return `8 x ${id}`;
    }
  }
  return null;
}

/**
 * Adds GPU configuration to URL parameters for HubSpot form pre-fill
 * @param gpuType - GPU type to add to URL
 * @returns Original URL before modification (for cleanup)
 */
export function addGpuToUrlParams(gpuType: string | null): string | null {
  const gpuValue = gpuType ? getHubSpotGpuValue(gpuType) : null;
  if (!gpuValue) return null;

  const originalUrl = window.location.href;
  const url = new URL(window.location.href);
  url.searchParams.set('form_gonka_preferred_configuration', gpuValue);
  url.searchParams.set('form_gonka_servers_number', '1');
  window.history.replaceState({}, '', url.toString());
  return originalUrl;
}

/**
 * Removes GPU configuration from URL parameters
 * @param originalUrl - Original URL to restore
 */
export function removeGpuFromUrlParams(originalUrl: string | null): void {
  if (!originalUrl) return;
  window.history.replaceState({}, '', originalUrl);
}
