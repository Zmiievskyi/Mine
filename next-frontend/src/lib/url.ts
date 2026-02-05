/**
 * URL utility functions for consistent URL handling across the application.
 */

/**
 * Ensures a path has a trailing slash for static export compatibility.
 * Handles paths with query parameters and hash fragments correctly.
 *
 * @example
 * ensureTrailingSlash('/about') // '/about/'
 * ensureTrailingSlash('/about/') // '/about/'
 * ensureTrailingSlash('/search?q=test') // '/search/?q=test'
 * ensureTrailingSlash('/page#section') // '/page/#section'
 */
export function ensureTrailingSlash(path: string): string {
  // Don't add trailing slash if path has query params or hash
  if (path.includes('?') || path.includes('#')) {
    const [basePath, rest] = path.split(/([?#])/);
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    return `${normalizedBase}${rest}${path.slice(basePath.length + 1)}`;
  }
  return path.endsWith('/') ? path : `${path}/`;
}

/**
 * Valid GPU types supported by the application.
 * Used for validating URL parameters.
 */
export const VALID_GPU_TYPES = ['A100', 'H100', 'H200', 'B200'] as const;
export type ValidGpuType = (typeof VALID_GPU_TYPES)[number];

/**
 * Validates and sanitizes a GPU type from URL parameters.
 * Returns null if the GPU type is invalid or doesn't match known types.
 *
 * @example
 * validateGpuType('NVIDIA H100') // 'NVIDIA H100'
 * validateGpuType('8x A100 Server') // '8x A100 Server'
 * validateGpuType('invalid') // null
 * validateGpuType(null) // null
 */
export function validateGpuType(gpuType: string | null): string | null {
  if (!gpuType) return null;

  // Check if the GPU type contains any valid GPU identifier
  const upperType = gpuType.toUpperCase();
  const isValid = VALID_GPU_TYPES.some((validType) => upperType.includes(validType));

  return isValid ? gpuType : null;
}
