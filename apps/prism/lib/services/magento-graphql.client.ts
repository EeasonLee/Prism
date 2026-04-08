import { REVALIDATE_SECONDS_CATALOG_SNAPSHOT } from '../api/cache-policy';
import { logRequest } from '../api/interceptors/request-logger';
import { env } from '../env';

function getMagentoGraphQLUrl(): string {
  const url = env.NEXT_PUBLIC_MAGENTO_GRAPHQL_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_MAGENTO_GRAPHQL_URL is not configured');
  }
  return url;
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

export async function magentoGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const url = getMagentoGraphQLUrl();
  const requestBody = { query, variables };
  const headers = {
    'Content-Type': 'application/json',
  };
  const startTime = Date.now();

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      next: { revalidate: REVALIDATE_SECONDS_CATALOG_SNAPSHOT },
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
    throw new MagentoGraphQLError(json.errors[0].message, json.errors);
  }

  if (!json.data) {
    throw new Error('GraphQL response missing data');
  }

  return json.data;
}
