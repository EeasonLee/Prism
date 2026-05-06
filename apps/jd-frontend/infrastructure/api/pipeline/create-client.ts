/**
 * createHttpClient() — HTTP 客户端工厂函数
 *
 * 显式的线性处理步骤：
 *   构造 URL → 设置 Header → 发 fetch → 解析响应 → 映射错误 → 记日志
 */

import type {
  ClientConfig,
  HttpClient,
  ReqOptions,
  RequestContext,
} from './types';
import { mapHttpError, normalizeError } from '../errors';
import { parseResponseBody } from './response-parser';
import { tracer } from '../tracer';

// ── Trace ID 生成 ───────────────────────────────────

let counter = 0;
function generateTraceId(): string {
  counter = (counter + 1) % 0xffff;
  const now = Date.now().toString(36);
  const c = counter.toString(16).padStart(4, '0');
  const rand = Math.random().toString(16).slice(2, 8);
  return `${now}-${c}-${rand}`;
}

// ── 请求上下文构建 ──────────────────────────────────

function buildRequestContext(
  config: ClientConfig,
  method: string,
  path: string,
  options?: ReqOptions
): RequestContext {
  // URL: 统一斜杠处理
  const base = config.baseURL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  const url = `${base}/${cleanPath}`;

  // Headers: 默认 + body 自动 Content-Type + 请求级覆盖
  const headers = new Headers(config.defaultHeaders);
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options?.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      headers.set(k, v);
    }
  }

  // Auth
  if (config.auth) {
    // Auth token 在发送前异步注入（见 request 方法）
  }

  return {
    url,
    headers,
    traceId: generateTraceId(),
    startTime: performance.now(),
    method,
  };
}

// ── 工厂函数 ────────────────────────────────────────

export function createHttpClient(config: ClientConfig): HttpClient {
  const isDev = process.env.NODE_ENV === 'development';

  async function request<T>(
    method: string,
    path: string,
    options?: ReqOptions
  ): Promise<T> {
    const ctx = buildRequestContext(config, method, path, options);

    // Auth token 注入（异步）
    if (config.auth) {
      const token = await config.auth.getToken();
      if (token) {
        ctx.headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // 超时控制
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeout);

    // 合并外部 signal
    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    // 构建 fetch body
    let body: BodyInit | undefined;
    if (options?.body) {
      body =
        options.body instanceof FormData ||
        typeof options.body === 'string' ||
        options.body instanceof Blob ||
        options.body instanceof ArrayBuffer ||
        options.body instanceof URLSearchParams
          ? (options.body as BodyInit)
          : JSON.stringify(options.body);
    }

    tracer?.recordStart(
      {
        traceId: ctx.traceId,
        method,
        url: ctx.url,
        headers: ctx.headers,
        startTime: ctx.startTime,
      },
      options?.body
    );

    if (isDev) {
      console.debug(`[api] ${method} ${ctx.url}`);
    }

    try {
      const res = await fetch(ctx.url, {
        method,
        headers: ctx.headers,
        signal: controller.signal,
        body,
        credentials: options?.credentials,
        cache: options?.cache,
        next: options?.next,
      });

      if (isDev) {
        console.debug(
          `[api] ${method} ${ctx.url} → ${res.status} (${Math.round(
            performance.now() - ctx.startTime
          )}ms)`
        );
      }

      // 错误映射
      if (!res.ok) {
        throw await mapHttpError(res, config.errorOverrides);
      }

      // 解析响应
      const data = await parseResponseBody<T>(res);
      tracer?.recordEnd(
        { traceId: ctx.traceId, startTime: ctx.startTime },
        res,
        data
      );
      return data;
    } catch (error) {
      tracer?.recordError(
        { traceId: ctx.traceId, startTime: ctx.startTime },
        error
      );

      if (isDev) {
        console.debug(
          `[api] ${method} ${ctx.url} → ERROR: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      // 重试
      if (config.retry && shouldRetry(error, config.retry)) {
        let lastError = error;
        for (let i = 0; i < config.retry.maxRetries; i++) {
          try {
            const retryRes = await fetch(ctx.url, {
              method,
              headers: ctx.headers,
              body,
              credentials: options?.credentials,
              // 重试不带缓存
              cache: 'no-store',
            });

            if (retryRes.ok) {
              const data = await parseResponseBody<T>(retryRes);
              tracer?.recordEnd(
                { traceId: ctx.traceId, startTime: ctx.startTime },
                retryRes,
                data
              );
              return data;
            }

            lastError = await mapHttpError(
              retryRes,
              config.errorOverrides
            ).catch(e => e);
          } catch (retryError) {
            lastError = retryError;
          }
        }
        throw normalizeError(lastError);
      }

      throw normalizeError(error);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    get<T>(path: string, opts?: ReqOptions): Promise<T> {
      return request<T>('GET', path, opts);
    },

    post<T>(path: string, opts?: ReqOptions): Promise<T> {
      return request<T>('POST', path, opts);
    },

    put<T>(path: string, opts?: ReqOptions): Promise<T> {
      return request<T>('PUT', path, opts);
    },

    patch<T>(path: string, opts?: ReqOptions): Promise<T> {
      return request<T>('PATCH', path, opts);
    },

    delete<T>(path: string, opts?: ReqOptions): Promise<T> {
      return request<T>('DELETE', path, opts);
    },
  };
}

// ── 重试判断 ────────────────────────────────────────

function shouldRetry(
  error: unknown,
  retryConfig: NonNullable<ClientConfig['retry']>
): boolean {
  // EOF 错误（GraphQL 常见）
  if (retryConfig.onEOF && error instanceof Error) {
    if (error.message.includes('EOF') || error.message.includes('unexpected')) {
      return true;
    }
  }

  // HTTP 状态码重试
  if (
    retryConfig.onStatus &&
    error &&
    typeof error === 'object' &&
    'status' in error
  ) {
    const status = (error as { status: number }).status;
    if (retryConfig.onStatus.includes(status)) {
      return true;
    }
  }

  return false;
}
