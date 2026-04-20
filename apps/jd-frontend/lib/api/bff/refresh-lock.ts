/**
 * Token 刷新并发锁（服务端专用）
 *
 * 防止多个并发 401 请求同时触发 refresh，确保同一进程内只有一次 refresh 在飞行中。
 * 其他请求复用同一个 Promise，获取相同的新 token。
 */

import type { AuthTokens } from '../magento/types';

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
