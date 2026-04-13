import { MagentoApiError } from '@/lib/api/magento/client';
import { getAccessToken, getRefreshToken } from '@/lib/auth/cookies';
import { env } from '@/lib/env';
import { extractWrappedMagentoAccessToken } from '@/lib/auth/session-tokens';
import { validateRefreshToken } from '@/lib/auth/session-tokens';
import { authenticatedMagentoGraphQL } from '@/lib/services/magento-graphql.client';
import { magentoRestFetch } from '../magento-rest-client';
import type { Address, Order, UpdateUserInput, User } from './types';

interface MagentoCustomer {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  addresses?: MagentoAddress[];
}

interface MagentoAddress {
  id?: number;
  firstname?: string;
  lastname?: string;
  street?: string[] | string;
  city?: string;
  country_id?: string;
}

interface MagentoOrder {
  entity_id: number;
  increment_id: string;
  status: string;
  grand_total: number;
  created_at: string;
}

interface MagentoOrdersResponse {
  items?: MagentoOrder[];
}

interface MagentoCustomerOrdersGraphQLResponse {
  customer: {
    orders?: {
      items?: Array<{
        id?: string | number | null;
        number?: string | null;
        status?: string | null;
        order_date?: string | null;
        total?: {
          grand_total?: {
            value?: number | null;
          } | null;
        } | null;
      }>;
    } | null;
  };
}

interface MagentoUpdateCustomerRequest {
  customer: {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
  };
}

export interface AccountService {
  getProfile(): Promise<User>;
  updateProfile(input: UpdateUserInput): Promise<void>;
  getOrders(): Promise<Order[]>;
  getAddresses(): Promise<Address[]>;
  logout(): Promise<void>;
}

export class AccountServiceError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'AccountServiceError';
  }
}

async function resolveMagentoAccessToken(request: Request): Promise<string> {
  const token = getAccessToken(request);
  const refreshToken = getRefreshToken(request);

  if (token) {
    if (!env.USE_LOCAL_AUTH) {
      return token;
    }

    try {
      return extractWrappedMagentoAccessToken(token);
    } catch {
      if (!refreshToken) {
        throw new AccountServiceError(
          'INVALID_ACCESS_TOKEN',
          401,
          'Access token is invalid'
        );
      }
      // access token 失效，继续尝试 refresh token
    }
  }

  if (!token && !refreshToken) {
    throw new AccountServiceError('NO_SESSION', 401, 'Authentication required');
  }

  if (refreshToken) {
    if (!env.USE_LOCAL_AUTH) {
      throw new AccountServiceError(
        'NO_ACCESS_TOKEN',
        401,
        'Authentication required'
      );
    }

    try {
      const payload = validateRefreshToken(refreshToken);
      return payload.magentoAccessToken;
    } catch {
      throw new AccountServiceError(
        'INVALID_REFRESH_TOKEN',
        401,
        'Authentication required'
      );
    }
  }

  throw new AccountServiceError('NO_SESSION', 401, 'Authentication required');
}

function toUser(customer: MagentoCustomer): User {
  return {
    id: customer.id,
    email: customer.email,
    firstname: customer.firstname,
    lastname: customer.lastname,
  };
}

function toOrder(order: MagentoOrder): Order {
  return {
    id: order.entity_id,
    number: order.increment_id,
    status: order.status,
    total: order.grand_total,
    createdAt: order.created_at,
  };
}

function toOrderFromGraphQL(
  order: NonNullable<
    NonNullable<
      MagentoCustomerOrdersGraphQLResponse['customer']['orders']
    >['items']
  >[number]
): Order {
  const numericId =
    typeof order.id === 'number'
      ? order.id
      : Number.parseInt(order.id ?? '0', 10) || 0;

  return {
    id: numericId,
    number: order.number ?? '',
    status: order.status ?? '',
    total: order.total?.grand_total?.value ?? 0,
    createdAt: order.order_date ?? '',
  };
}

function toAddress(address: MagentoAddress): Address {
  const street = Array.isArray(address.street)
    ? address.street.filter(line => line.length > 0).join(', ')
    : address.street ?? '';

  return {
    id: address.id ?? 0,
    firstname: address.firstname ?? '',
    lastname: address.lastname ?? '',
    street,
    city: address.city ?? '',
    country: address.country_id ?? '',
  };
}

export class MagentoAccountService implements AccountService {
  constructor(private readonly accessToken: string) {}

  private async request<T>(
    path: string,
    options: {
      method?: string;
      body?: string;
    } = {}
  ): Promise<T> {
    try {
      return await magentoRestFetch<T>(path, {
        method: options.method,
        body: options.body,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
    } catch (error) {
      if (error instanceof AccountServiceError) {
        throw error;
      }

      if (error instanceof MagentoApiError) {
        if (error.status === 401) {
          throw new AccountServiceError(
            'UPSTREAM_UNAUTHORIZED',
            401,
            'Token is not accepted by Magento REST'
          );
        }

        throw new AccountServiceError(
          'MAGENTO_API_ERROR',
          error.status || 502,
          error.message || 'Upstream request failed'
        );
      }

      throw new AccountServiceError(
        'INTERNAL_ERROR',
        500,
        'Internal server error'
      );
    }
  }

  private getMeRaw(): Promise<MagentoCustomer> {
    return this.request<MagentoCustomer>('/customers/me');
  }

  async getProfile(): Promise<User> {
    const customer = await this.getMeRaw();
    return toUser(customer);
  }

  async updateProfile(input: UpdateUserInput): Promise<void> {
    const current = await this.getMeRaw();
    const payload: MagentoUpdateCustomerRequest = {
      customer: {
        id: current.id,
        email: input.email ?? current.email,
        firstname: input.firstname ?? current.firstname,
        lastname: input.lastname ?? current.lastname,
      },
    };

    await this.request<MagentoCustomer>('/customers/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getOrders(): Promise<Order[]> {
    try {
      const response = await this.request<MagentoOrdersResponse>(
        '/orders?searchCriteria[currentPage]=1'
      );
      return (response.items ?? []).map(toOrder);
    } catch (error) {
      if (
        error instanceof AccountServiceError &&
        error.code === 'UPSTREAM_UNAUTHORIZED'
      ) {
        const query = `
          query GetCustomerOrders {
            customer {
              orders {
                items {
                  id
                  number
                  status
                  order_date
                  total {
                    grand_total {
                      value
                    }
                  }
                }
              }
            }
          }
        `;

        const graphqlResponse =
          await authenticatedMagentoGraphQL<MagentoCustomerOrdersGraphQLResponse>(
            this.accessToken,
            query
          );
        const items = graphqlResponse.customer.orders?.items ?? [];
        return items.map(toOrderFromGraphQL);
      }
      throw error;
    }
  }

  async getAddresses(): Promise<Address[]> {
    const customer = await this.getMeRaw();
    return (customer.addresses ?? []).map(toAddress);
  }

  async logout(): Promise<void> {
    try {
      await this.request<boolean>(
        '/integration/customer/revoke-customer-token',
        {
          method: 'POST',
        }
      );
    } catch (error) {
      if (error instanceof AccountServiceError && error.status === 401) {
        return;
      }
      throw error;
    }
  }
}

export async function createAccountService(
  request: Request
): Promise<AccountService> {
  const magentoAccessToken = await resolveMagentoAccessToken(request);
  return new MagentoAccountService(magentoAccessToken);
}
