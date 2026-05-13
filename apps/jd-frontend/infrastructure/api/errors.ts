/**
 * 统一 API 错误类型
 *
 * 自包含错误树，不依赖 @prism/shared。
 * 所有 HTTP 客户端统一使用此文件中的错误类。
 */

// ── 根 ──────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

// ── 网络 / 超时 ─────────────────────────────────────

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}

// ── HTTP 状态 ────────────────────────────────────────

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', data?: unknown) {
    super(message, 401, 'UNAUTHORIZED', data);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Permission denied', data?: unknown) {
    super(message, 403, 'FORBIDDEN', data);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', data?: unknown) {
    super(message, 404, 'NOT_FOUND', data);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', data?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', data);
    this.name = 'ValidationError';
  }
}

export class ServerError extends ApiError {
  constructor(status: number, message = 'Server error', data?: unknown) {
    super(message, status, 'SERVER_ERROR', data);
    this.name = 'ServerError';
  }
}

export class MagentoApiError extends ApiError {
  constructor(
    message: string,
    public code: string,
    status: number,
    public detail: unknown = null
  ) {
    super(message, status, code, detail);
    this.name = 'MagentoApiError';
  }
}

export class MagentoServiceError extends MagentoApiError {
  constructor(
    message = 'Service temporarily unavailable, please try again later',
    detail: unknown = null
  ) {
    super(message, 'SERVICE_UNAVAILABLE', 502, detail);
    this.name = 'MagentoServiceError';
  }
}

// ── 子系统特化 ───────────────────────────────────────

export interface GraphQLErrorItem {
  message: string;
  extensions?: Record<string, unknown>;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
}

export class MagentoGraphQLError extends ServerError {
  public readonly errors: GraphQLErrorItem[];

  constructor(message: string, errors: GraphQLErrorItem[] = []) {
    super(500, message);
    this.name = 'MagentoGraphQLError';
    this.errors = errors;
  }
}

// ── 类型守卫 ─────────────────────────────────────────

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isMagentoGraphQLError(
  error: unknown
): error is MagentoGraphQLError {
  return error instanceof MagentoGraphQLError;
}

export function isMagentoApiError(error: unknown): error is MagentoApiError {
  if (error instanceof MagentoApiError) return true;
  return (
    error instanceof Error &&
    (error.name === 'MagentoApiError' ||
      error.name === 'MagentoServiceError') &&
    typeof (error as { status?: unknown }).status === 'number'
  );
}

// ── 统一错误映射 ─────────────────────────────────────

export type ErrorMapper = (
  status: number,
  body: unknown
) => Error | null | undefined;

export async function mapHttpError(
  res: Response,
  overrides?: ErrorMapper
): Promise<never> {
  // 子系统优先处理（如 GraphQL 的 body.errors）
  if (overrides) {
    const body = await res
      .clone()
      .json()
      .catch(() => null);
    const result = overrides(res.status, body);
    if (result) throw result;
  }

  const rawBody = await res.text().catch(() => null);
  const message =
    rawBody && rawBody.length > 0
      ? rawBody
      : res.statusText || `HTTP ${res.status}`;

  // 尝试从标准错误响应中提取更友好的消息
  let extractedMessage: string | undefined;
  if (rawBody) {
    try {
      const parsed = JSON.parse(rawBody);
      // Strapi 风格: { error: { message: "..." } }
      if (parsed?.error?.message) {
        extractedMessage = parsed.error.message;
      }
      // Magento 风格: { message: "...", trace: "..." }
      else if (parsed?.message) {
        extractedMessage = parsed.message;
      }
    } catch {
      // 非 JSON body，用 rawBody
    }
  }

  const displayMessage = extractedMessage ?? message;

  // 5xx / 502 使用用户友好消息，避免原始 HTML/nginx 错误页暴露给前端
  const userFriendlyMessage = 'Server error, please try again later';

  if (process.env.NODE_ENV === 'development') {
    console.warn(`[api] HTTP ${res.status} — ${displayMessage.slice(0, 200)}`);
  }

  switch (res.status) {
    case 400:
      throw new ApiError(displayMessage, 400, 'BAD_REQUEST');
    case 401:
      throw new AuthenticationError(displayMessage);
    case 403:
      throw new AuthorizationError(displayMessage);
    case 404:
      throw new NotFoundError(displayMessage);
    case 422:
      throw new ValidationError(displayMessage);
    case 502:
      throw new MagentoServiceError(userFriendlyMessage, displayMessage);
    default:
      if (res.status >= 500)
        throw new ServerError(res.status, userFriendlyMessage, displayMessage);
      throw new ApiError(displayMessage, res.status);
  }
}

// ── 错误标准化 ───────────────────────────────────────

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new TimeoutError(error.message);
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError(error.message);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0, 'UNKNOWN_ERROR');
  }

  return new ApiError(String(error), 0, 'UNKNOWN_ERROR');
}
