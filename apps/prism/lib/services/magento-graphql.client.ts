import { REVALIDATE_SECONDS_CATALOG_SNAPSHOT } from '../api/cache-policy';
import { logRequest } from '../api/interceptors/request-logger';
import { MagentoApiError } from '../api/magento/client';
import { env } from '../env';

function getMagentoGraphQLUrl(): string {
  const explicitGraphqlUrl = env.NEXT_PUBLIC_MAGENTO_GRAPHQL_URL;
  if (explicitGraphqlUrl) {
    return explicitGraphqlUrl;
  }

  const magentoBaseUrl = env.NEXT_PUBLIC_MAGENTOL;
  if (magentoBaseUrl) {
    return `${magentoBaseUrl.replace(/\/$/, '')}/graphql`;
  }

  throw new Error(
    'NEXT_PUBLIC_MAGENTO_GRAPHQL_URL or NEXT_PUBLIC_MAGENTOL is not configured'
  );
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
}

export class MagentoGraphQLError extends Error {
  constructor(message: string, public errors: Array<{ message: string }>) {
    super(message);
    this.name = 'MagentoGraphQLError';
  }
}

async function executeMagentoGraphQL<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  headers: Record<string, string>,
  fetchOptions: Pick<RequestInit, 'cache'> & {
    next?: { revalidate: number };
  }
): Promise<T> {
  const url = getMagentoGraphQLUrl();
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new Error('GraphQL query cannot be empty');
  }
  const requestBody = { query: normalizedQuery, variables };
  const startTime = Date.now();

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      ...fetchOptions,
    });
  } catch (error) {
    logRequest({
      method: 'POST',
      url,
      endpoint: 'magento/graphql',
      duration: Date.now() - startTime,
      requestHeaders: headers,
      requestBody,
      error: error instanceof Error ? error : String(error),
    });
    throw error;
  }

  const duration = Date.now() - startTime;

  let json: GraphQLResponse<T>;

  try {
    json = (await response.json()) as GraphQLResponse<T>;
  } catch (error) {
    logRequest({
      method: 'POST',
      url,
      endpoint: 'magento/graphql',
      status: response.status,
      statusText: response.statusText,
      duration,
      requestHeaders: headers,
      responseHeaders: response.headers,
      requestBody,
      error: error instanceof Error ? error : String(error),
    });
    throw error;
  }

  logRequest({
    method: 'POST',
    url,
    endpoint: 'magento/graphql',
    status: response.status,
    statusText: response.statusText,
    duration,
    requestHeaders: headers,
    responseHeaders: response.headers,
    requestBody,
    responseBody: json,
  });

  if (!response.ok) {
    throw new Error(
      `GraphQL request failed: ${response.status} ${response.statusText}`
    );
  }

  if (json.errors && json.errors.length > 0) {
    const hasUnexpectedEof = json.errors.some(error =>
      error.message.includes('Unexpected <EOF>')
    );
    // Magento 偶发会返回空查询语法错误，重试一次 no-store 以绕过缓存层异常。
    if (hasUnexpectedEof && fetchOptions.cache !== 'no-store') {
      return executeMagentoGraphQL(query, variables, headers, {
        cache: 'no-store',
      });
    }

    const authError = json.errors.find(error => {
      const category = error.extensions?.category;
      return (
        typeof category === 'string' &&
        category.toLowerCase().includes('authorization')
      );
    });

    if (authError) {
      throw new MagentoApiError(authError.message, 'TOKEN_EXPIRED', 401);
    }

    throw new MagentoGraphQLError(json.errors[0].message, json.errors);
  }

  if (!json.data) {
    throw new Error('GraphQL response missing data');
  }

  return json.data;
}

export async function magentoGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  return executeMagentoGraphQL(
    query,
    variables,
    {
      'Content-Type': 'application/json',
    },
    {
      next: { revalidate: REVALIDATE_SECONDS_CATALOG_SNAPSHOT },
    }
  );
}

export async function magentoGraphQLNoCache<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  return executeMagentoGraphQL(
    query,
    variables,
    {
      'Content-Type': 'application/json',
    },
    {
      cache: 'no-store',
    }
  );
}

export async function authenticatedMagentoGraphQL<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  return executeMagentoGraphQL(
    query,
    variables,
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    {
      cache: 'no-store',
    }
  );
}
