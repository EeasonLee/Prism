export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

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

export interface GraphQLErrorItem {
  message: string;
  extensions?: Record<string, unknown>;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
}

export class GraphQLApiError extends ServerError {
  public readonly errors: GraphQLErrorItem[];

  constructor(message: string, errors: GraphQLErrorItem[] = []) {
    super(500, message);
    this.name = 'GraphQLApiError';
    this.errors = errors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isGraphQLApiError(error: unknown): error is GraphQLApiError {
  return error instanceof GraphQLApiError;
}

export type ErrorMapper = (
  status: number,
  body: unknown
) => Error | null | undefined;

function extractMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const bodyRecord = body as Record<string, unknown>;
  const nestedError = bodyRecord.error;
  if (nestedError && typeof nestedError === 'object') {
    const message = (nestedError as Record<string, unknown>).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return typeof bodyRecord.message === 'string'
    ? bodyRecord.message
    : undefined;
}

export async function mapHttpError(
  response: Response,
  overrides?: ErrorMapper
): Promise<never> {
  const parsedBody = await response
    .clone()
    .json()
    .catch((): unknown => null);

  if (overrides) {
    const result = overrides(response.status, parsedBody);
    if (result) {
      throw result;
    }
  }

  const rawBody = await response.text().catch(() => '');
  const fallbackMessage =
    rawBody || response.statusText || `HTTP ${response.status}`;
  const displayMessage = extractMessage(parsedBody) ?? fallbackMessage;
  const serverMessage = 'Server error, please try again later';

  switch (response.status) {
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
    default:
      if (response.status >= 500) {
        throw new ServerError(response.status, serverMessage, displayMessage);
      }
      throw new ApiError(displayMessage, response.status);
  }
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError(error.message, 408, 'TIMEOUT');
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new ApiError(error.message, 0, 'NETWORK_ERROR');
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0, 'UNKNOWN_ERROR');
  }

  return new ApiError(String(error), 0, 'UNKNOWN_ERROR');
}
