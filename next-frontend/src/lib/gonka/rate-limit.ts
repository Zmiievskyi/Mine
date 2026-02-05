// Simple in-memory rate limiter for API routes
// For production at scale, consider using @upstash/ratelimit with Redis

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface ClientIdentifierConfig {
  /**
   * Number of trusted proxies in front of the application.
   * Used to extract the correct client IP from X-Forwarded-For chain.
   * Default: 0 (no trusted proxies, use fallback for security)
   *
   * Example: If behind 1 proxy (nginx), set to 1
   * X-Forwarded-For: "client, proxy" -> extracts "client"
   */
  trustedProxyCount?: number;
}

// In-memory store for rate limiting
// Note: This resets on server restart and doesn't work across multiple instances
// For distributed deployments, use Redis-based rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60000; // 1 minute
let lastCleanup = Date.now();
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Clean up expired rate limit entries to prevent memory growth.
 * Runs on every request (throttled) and via periodic interval.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Start periodic cleanup to handle memory growth under low traffic
// This ensures stale entries are cleaned even without incoming requests
if (typeof setInterval !== 'undefined' && cleanupIntervalId === null) {
  cleanupIntervalId = setInterval(() => {
    // Force cleanup by resetting lastCleanup
    lastCleanup = 0;
    cleanupExpiredEntries();
  }, CLEANUP_INTERVAL_MS * 5); // Run every 5 minutes

  // Prevent the interval from keeping Node.js alive during shutdown
  if (cleanupIntervalId.unref) {
    cleanupIntervalId.unref();
  }
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (IP address or other key)
 * @param config - Rate limit configuration
 * @returns Object with success flag and rate limit info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimiterConfig
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No existing entry or window expired - create new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime,
    };
  }

  // Window still active - check count
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Validate if a string is a valid IPv4 or IPv6 address
 * @param ip - IP address string to validate
 * @returns true if valid IPv4 or IPv6, false otherwise
 */
function isValidIpAddress(ip: string): boolean {
  // IPv4 pattern: 0-255.0-255.0-255.0-255
  const ipv4Pattern = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

  // IPv6 pattern: simplified validation for common formats
  // Matches full form and compressed forms (::)
  const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Create a hash of request characteristics for fallback identification
 * Used when IP address cannot be reliably determined
 * @param request - Request object
 * @returns Hash string for rate limiting
 */
async function createFallbackIdentifier(request: Request): Promise<string> {
  // Combine multiple request characteristics
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';

  // Create a fingerprint from request characteristics
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;

  // Hash the fingerprint for privacy and consistent length
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `fallback-${hashHex.substring(0, 16)}`;
}

/**
 * Get client identifier from request headers with IP spoofing protection
 *
 * SECURITY CONSIDERATIONS:
 * - X-Forwarded-For and X-Real-IP headers can be spoofed by attackers
 * - Only trust these headers when behind a known number of trusted proxies
 * - Always validate IP addresses before using them for rate limiting
 * - Fall back to request fingerprinting when IP cannot be reliably determined
 *
 * @param request - Request object
 * @param config - Configuration for trusted proxy count
 * @returns Client identifier string for rate limiting
 *
 * @example
 * // No trusted proxies (default, most secure for direct connections)
 * const id = await getClientIdentifier(request);
 *
 * // Behind 1 trusted proxy (e.g., nginx)
 * const id = await getClientIdentifier(request, { trustedProxyCount: 1 });
 */
export async function getClientIdentifier(
  request: Request,
  config: ClientIdentifierConfig = {}
): Promise<string> {
  const { trustedProxyCount = 0 } = config;

  // Only trust X-Forwarded-For if we have configured trusted proxies
  if (trustedProxyCount > 0) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      // X-Forwarded-For format: "client, proxy1, proxy2, ..."
      // Extract the IP that is `trustedProxyCount` positions from the right
      const ips = forwardedFor.split(',').map(ip => ip.trim());

      // Calculate which IP to use based on trusted proxy count
      // If trustedProxyCount = 1: use second-to-last (client IP before our proxy)
      // If trustedProxyCount = 2: use third-to-last, etc.
      const targetIndex = Math.max(0, ips.length - trustedProxyCount - 1);
      const clientIp = ips[targetIndex];

      // Validate the extracted IP
      if (clientIp && isValidIpAddress(clientIp)) {
        return clientIp;
      }
    }

    // Try X-Real-IP as fallback (nginx specific)
    const realIp = request.headers.get('x-real-ip');
    if (realIp && isValidIpAddress(realIp)) {
      return realIp;
    }
  }

  // If no trusted proxies or validation failed, use fallback fingerprinting
  // This prevents IP spoofing attacks while still providing rate limiting
  return await createFallbackIdentifier(request);
}

/** Default rate limit config: 30 requests per minute */
export const DEFAULT_RATE_LIMIT: RateLimiterConfig = {
  limit: 30,
  windowMs: 60000, // 1 minute
};
