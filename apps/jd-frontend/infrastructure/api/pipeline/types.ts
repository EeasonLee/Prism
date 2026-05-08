/**
 * Pipeline 核心类型定义
 */

// ── Auth ─────────────────────────────────────────────

export interface AuthProvider {
  getToken(): string | Promise<string>;
}

// ── Retry ────────────────────────────────────────────

export interface RetryConfig {
  maxRetries: number;
  onStatus?: number[]; // 对这些状态码重试
  onEOF?: boolean; // 对 EOF 错误重试（GraphQL）
}

// ── Request ──────────────────────────────────────────

export interface ReqOptions {
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Request credentials mode (e.g. 'include' for cookies) */
  credentials?: RequestCredentials;
  /** Next.js fetch 缓存选项（server-only） */
  cache?: RequestCache;
  /** Next.js ISR 选项（server-only） */
  next?: { revalidate?: number | false; tags?: string[] };
}

export interface RequestContext {
  url: string;
  headers: Headers;
  traceId: string;
  startTime: number;
  method: string;
}

// ── Client ───────────────────────────────────────────

export interface ClientConfig {
  baseURL: string;
  timeout: number;
  defaultHeaders?: Record<string, string>;
  auth?: AuthProvider;
  retry?: RetryConfig;
  errorOverrides?: (status: number, body: unknown) => Error | null | undefined;
}

export interface HttpClient {
  get<T = unknown>(path: string, opts?: ReqOptions): Promise<T>;
  post<T = unknown>(path: string, opts?: ReqOptions): Promise<T>;
  put<T = unknown>(path: string, opts?: ReqOptions): Promise<T>;
  patch<T = unknown>(path: string, opts?: ReqOptions): Promise<T>;
  delete<T = unknown>(path: string, opts?: ReqOptions): Promise<T>;
}
