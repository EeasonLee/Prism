/**
 * 统一 API 层入口（双端安全）
 *
 * 不包含 server-only 客户端实例。
 * server-only 客户端见 server.ts
 */

// ── 工厂函数 ────────────────────────────────────────

export { createHttpClient } from './pipeline/create-client';

// ── 类型 ────────────────────────────────────────────

export type {
  ClientConfig,
  HttpClient,
  ReqOptions,
  AuthProvider,
  RetryConfig,
  RequestContext,
} from './pipeline/types';

// ── 错误 ────────────────────────────────────────────

export {
  ApiError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ServerError,
  MagentoApiError,
  MagentoServiceError,
  MagentoGraphQLError,
  isApiError,
  isNetworkError,
  isTimeoutError,
  isMagentoApiError,
  isMagentoGraphQLError,
  mapHttpError,
  normalizeError,
} from './errors';

export type { GraphQLErrorItem, ErrorMapper } from './errors';

// ── 工具 ────────────────────────────────────────────

export {
  normalizeBaseURL,
  joinURL,
  isServerSide,
  isDevelopment,
} from './config';
export { parseResponseBody } from './pipeline/response-parser';
