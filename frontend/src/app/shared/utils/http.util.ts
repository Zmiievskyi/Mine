/**
 * HTTP utility functions for URL and query parameter construction
 */

/**
 * Builds a query string from an object, filtering out null/undefined/empty values
 *
 * @param params - Object with key-value pairs to convert to query parameters
 * @returns URLSearchParams-formatted query string (without leading '?')
 *
 * @example
 * buildQueryString({ page: 1, search: 'test', empty: '' })
 * // Returns: "page=1&search=test"
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

/**
 * Builds a URL with optional query parameters
 *
 * @param baseUrl - The base URL without query parameters
 * @param query - Optional object with query parameters
 * @returns Complete URL with query string if parameters exist
 *
 * @example
 * buildUrlWithQuery('/api/users', { page: 1, role: 'admin' })
 * // Returns: "/api/users?page=1&role=admin"
 *
 * buildUrlWithQuery('/api/users')
 * // Returns: "/api/users"
 */
export function buildUrlWithQuery(baseUrl: string, query?: Record<string, any>): string {
  if (!query) return baseUrl;
  const queryString = buildQueryString(query);
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
