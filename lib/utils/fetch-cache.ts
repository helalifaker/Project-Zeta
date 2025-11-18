/**
 * Global Fetch Cache Utility
 * Prevents duplicate concurrent requests for the same URL
 * Improves performance by reusing in-flight requests
 */

interface CachedRequest {
  promise: Promise<Response>;
  timestamp: number;
}

// Global cache for in-flight requests (shared across all components)
const requestCache = new Map<string, CachedRequest>();

// Cleanup old entries (older than 5 seconds) to prevent memory leaks
const MAX_CACHE_AGE = 5000; // 5 seconds

function cleanupCache(): void {
  const now = Date.now();
  for (const [url, cached] of requestCache.entries()) {
    if (now - cached.timestamp > MAX_CACHE_AGE) {
      requestCache.delete(url);
    }
  }
}

/**
 * Cached fetch - prevents duplicate concurrent requests
 * If a request for the same URL is already in flight, returns the existing promise
 * 
 * @param url - Request URL
 * @param options - Fetch options (same as native fetch)
 * @returns Promise<Response>
 */
export function cachedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Cleanup old entries periodically
  if (Math.random() < 0.1) {
    // 10% chance to cleanup (avoid doing it on every request)
    cleanupCache();
  }

  // Create cache key from URL and method (GET requests are most common)
  const method = options?.method || 'GET';
  const cacheKey = `${method}:${url}`;

  // Check if request is already in flight
  const existing = requestCache.get(cacheKey);
  if (existing) {
    const age = Date.now() - existing.timestamp;
    if (age < MAX_CACHE_AGE) {
      // Return existing promise (deduplication)
      return existing.promise;
    } else {
      // Request is too old, remove it
      requestCache.delete(cacheKey);
    }
  }

  // Create new request
  const promise = fetch(url, options).finally(() => {
    // Remove from cache when request completes (success or failure)
    // Use setTimeout to allow other concurrent requests to reuse the promise
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, 100); // Small delay to allow concurrent requests to reuse
  });

  // Cache the promise
  requestCache.set(cacheKey, {
    promise,
    timestamp: Date.now(),
  });

  return promise;
}

/**
 * Clear the fetch cache (useful for testing or forced refresh)
 */
export function clearFetchCache(): void {
  requestCache.clear();
}

/**
 * Get cache statistics (for debugging)
 */
export function getFetchCacheStats(): { size: number; entries: string[] } {
  return {
    size: requestCache.size,
    entries: Array.from(requestCache.keys()),
  };
}

