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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(
      `GraphQL request failed: ${response.status} ${response.statusText}`
    );
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new MagentoGraphQLError(json.errors[0].message, json.errors);
  }

  if (!json.data) {
    throw new Error('GraphQL response missing data');
  }

  return json.data;
}
