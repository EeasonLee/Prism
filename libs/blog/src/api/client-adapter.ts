/**
 * API Client 适配器接口
 * 用于解耦 blog 库和应用层的 apiClient
 */

export interface ApiClientAdapter {
  get<T = unknown>(
    endpoint: string,
    options?: {
      signal?: AbortSignal;
      skipLogging?: boolean;
      next?: { revalidate?: number };
    }
  ): Promise<T>;
}
