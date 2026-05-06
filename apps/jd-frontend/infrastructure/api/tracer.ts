/**
 * RequestTracer — 请求追踪器
 *
 * 仅 dev 环境生效（process.env.NODE_ENV === 'development'）。
 * 使用 ring buffer 限制内存，上限 500 条。
 * 生产构建时通过 if (isDev) 守卫 → 树摇移除。
 */

interface RequestLogEntry {
  traceId: string;
  method: string;
  url: string;
  startTime: number;
  duration: number;
  status: number;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  responseHeaders: Record<string, string>;
  responseBody?: unknown;
  error?: { type: string; message: string };
  side: 'server' | 'client';
}

class RequestTracer {
  private buffer: RequestLogEntry[] = [];
  private readonly MAX = 500;
  private partial: Map<
    string,
    {
      method: string;
      url: string;
      startTime: number;
      requestHeaders: Record<string, string>;
      requestBody?: unknown;
      side: 'server' | 'client';
    }
  > = new Map();

  recordStart(
    ctx: {
      traceId: string;
      method: string;
      url: string;
      headers: Headers;
      startTime: number;
    },
    reqBody?: unknown
  ): void {
    const headers: Record<string, string> = {};
    ctx.headers.forEach((v, k) => {
      headers[k] = v;
    });

    this.partial.set(ctx.traceId, {
      method: ctx.method,
      url: ctx.url,
      startTime: ctx.startTime,
      requestHeaders: headers,
      requestBody: reqBody,
      side: typeof window === 'undefined' ? 'server' : 'client',
    });
  }

  recordEnd(
    ctx: {
      traceId: string;
      startTime: number;
    },
    res: Response,
    resBody?: unknown
  ): void {
    const entry = this.partial.get(ctx.traceId);
    if (!entry) return;

    const resHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });

    this.push({
      traceId: ctx.traceId,
      method: entry.method,
      url: entry.url,
      startTime: entry.startTime,
      duration: performance.now() - ctx.startTime,
      status: res.status,
      requestHeaders: entry.requestHeaders,
      requestBody: entry.requestBody,
      responseHeaders: resHeaders,
      responseBody: resBody,
      side: entry.side,
    });

    this.partial.delete(ctx.traceId);
  }

  recordError(
    ctx: {
      traceId: string;
      startTime: number;
    },
    error: unknown
  ): void {
    const entry = this.partial.get(ctx.traceId);
    if (!entry) return;

    const err =
      error instanceof Error
        ? { type: error.name, message: error.message }
        : { type: 'Unknown', message: String(error) };

    // Infer status from known error types
    let status = 0;
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      typeof (error as { status: unknown }).status === 'number'
    ) {
      status = (error as { status: number }).status;
    }

    this.push({
      traceId: ctx.traceId,
      method: entry.method,
      url: entry.url,
      startTime: entry.startTime,
      duration: performance.now() - ctx.startTime,
      status,
      requestHeaders: entry.requestHeaders,
      requestBody: entry.requestBody,
      responseHeaders: {},
      error: err,
      side: entry.side,
    });

    this.partial.delete(ctx.traceId);
  }

  getAll(): RequestLogEntry[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
    this.partial.clear();
  }

  private push(entry: RequestLogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.MAX) {
      this.buffer = this.buffer.slice(-this.MAX);
    }
  }
}

// 仅 dev 环境创建实例；prod 环境为 null（树摇移除）
const isDev = process.env.NODE_ENV === 'development';

export const tracer = isDev ? new RequestTracer() : null;

export type { RequestLogEntry };
