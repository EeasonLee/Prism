/**
 * Magento GraphQL 客户端
 */
import { createHttpClient } from '../pipeline/create-client';
import type { ErrorMapper } from '../errors';
import { MagentoGraphQLError, MagentoApiError } from '../errors';
import { env } from '@/core/config/env';
import { REVALIDATE_SECONDS_CATALOG_SNAPSHOT } from '@/core/config/cache-policy';

const graphqlErrorMapper: ErrorMapper = (_status, body) => {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (Array.isArray(b.errors) && b.errors.length > 0) {
      // Check for auth errors first (extensions.category === 'authorization')
      const authError = (
        b.errors as Array<{
          message: string;
          extensions?: Record<string, unknown>;
        }>
      ).find(error => {
        const category = error.extensions?.category;
        return (
          typeof category === 'string' &&
          category.toLowerCase().includes('authorization')
        );
      });
      if (authError) {
        return new MagentoApiError(authError.message, 'TOKEN_EXPIRED', 401);
      }

      const firstMsg =
        typeof b.errors[0] === 'object' && b.errors[0] !== null
          ? String(
              (b.errors[0] as Record<string, unknown>).message ??
                'GraphQL error'
            )
          : 'GraphQL error';
      return new MagentoGraphQLError(
        firstMsg,
        b.errors as Array<{
          message: string;
          extensions?: Record<string, unknown>;
        }>
      );
    }
  }
  return null;
};

export const magentoGraphQLClient = createHttpClient({
  baseURL:
    env.NEXT_PUBLIC_MAGENTO_GRAPHQL_URL ??
    (env.MAGENTO_URL ? `${env.MAGENTO_URL}/graphql` : ''),
  timeout: 20000,
  defaultHeaders: { 'Content-Type': 'application/json' },
  retry: { maxRetries: 1, onEOF: true },
  errorOverrides: graphqlErrorMapper,
});

// Backward-compatible wrappers for callers using old function signatures

interface GraphQLResponseBody<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

function unwrapGraphQLResponse<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const resp = raw as GraphQLResponseBody<T>;
    // Handle GraphQL errors in 200 responses (errorOverrides only runs on non-OK status)
    if (Array.isArray(resp.errors) && resp.errors.length > 0) {
      const authError = resp.errors.find(e => {
        const category = e.extensions?.category;
        return (
          typeof category === 'string' &&
          category.toLowerCase().includes('authorization')
        );
      });
      if (authError) {
        throw new MagentoApiError(authError.message, 'TOKEN_EXPIRED', 401);
      }
      throw new MagentoGraphQLError(resp.errors[0].message, resp.errors);
    }
    return resp.data as T;
  }
  return raw as T;
}

export async function magentoGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const raw = await magentoGraphQLClient.post<GraphQLResponseBody<T>>('', {
    body: { query, variables },
    next: { revalidate: REVALIDATE_SECONDS_CATALOG_SNAPSHOT },
  });
  return unwrapGraphQLResponse<T>(raw);
}

export async function magentoGraphQLNoCache<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const raw = await magentoGraphQLClient.post<GraphQLResponseBody<T>>('', {
    body: { query, variables },
    cache: 'no-store',
  });
  return unwrapGraphQLResponse<T>(raw);
}
