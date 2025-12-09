interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Simple LRU (Least Recently Used) cache with TTL support.
 * - Evicts oldest entries when max size is reached
 * - Entries expire after TTL
 * - Thread-safe through Map's built-in ordering
 */
export class LruCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize: number = 100, ttlSeconds: number = 120) {
    this.maxSize = maxSize;
    this.ttlMs = ttlSeconds * 1000;
  }

  /**
   * Get value from cache if exists and not expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  /**
   * Set value in cache, evicting oldest if at capacity
   */
  set(key: string, data: T): void {
    // Remove existing entry to update its position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get value even if expired (for graceful degradation)
   */
  getStale(key: string): T | null {
    const entry = this.cache.get(key);
    return entry?.data ?? null;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Remove entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }
}
