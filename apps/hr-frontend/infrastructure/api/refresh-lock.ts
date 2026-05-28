/**
 * Token refresh concurrency lock (server-side only)
 *
 * Prevents multiple concurrent 401 responses from triggering refresh simultaneously.
 * Ensures only one refresh is in-flight per process; other requests reuse the same
 * Promise and receive the same new tokens.
 */

import type { AuthTokens } from '@/features/auth/types';

let refreshPromise: Promise<AuthTokens | null> | null = null;

export function withRefreshLock(
  refreshFn: () => Promise<AuthTokens | null>
): Promise<AuthTokens | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = refreshFn()
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
