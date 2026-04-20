import { isMagentoApiError } from '@/lib/api/magento/client';
import { getAccessToken, getRefreshToken } from '@/lib/auth/cookies';
import { extractWrappedMagentoAccessToken } from '@/lib/auth/session-tokens';
import { validateRefreshToken } from '@/lib/auth/session-tokens';
import {
  authenticatedMagentoGraphQL,
  MagentoGraphQLError,
} from '@/lib/services/magento-graphql.client';
import { magentoRestFetch } from '../magento-rest-client';
import type {
  Address,
  Order,
  OrderAddress,
  OrderDetail,
  OrderItem,
  UpdateUserInput,
  User,
} from './types';

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
  order_currency_code?: string;
  created_at: string;
}

interface MagentoOrdersResponse {
  items?: MagentoOrder[];
}

interface MagentoOrderItem {
  item_id: number;
  name: string;
  sku: string;
  price: number;
  qty_ordered: number;
  row_total: number;
}

interface MagentoOrderAddress {
  firstname?: string;
  lastname?: string;
  street?: string[] | string;
  city?: string;
  region_code?: string;
  postcode?: string;
  country_id?: string;
  telephone?: string;
}

interface MagentoShippingAssignment {
  shipping?: {
    address?: MagentoOrderAddress;
    method?: string;
  } | null;
  items?: MagentoOrderItem[];
}

interface MagentoOrderDetail {
  entity_id: number;
  increment_id: string;
  status: string;
  grand_total: number;
  order_currency_code?: string;
  created_at: string;
  subtotal?: number;
  shipping_amount?: number;
  tax_amount?: number;
  discount_amount?: number;
  shipping_description?: string;
  items?: MagentoOrderItem[];
  billing_address?: MagentoOrderAddress;
  extension_attributes?: {
    shipping_assignments?: MagentoShippingAssignment[];
  } | null;
  payment?: {
    method?: string;
  } | null;
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
            currency?: string | null;
          } | null;
        } | null;
      }>;
    } | null;
  };
}

interface MagentoCustomerOrderDetailGraphQLResponse {
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
            currency?: string | null;
          } | null;
          subtotal?: { value?: number | null } | null;
          shipping_handling?: {
            total_amount?: { value?: number | null } | null;
          } | null;
          taxes?: Array<{
            amount?: { value?: number | null } | null;
          }> | null;
          discounts?: Array<{
            amount?: { value?: number | null } | null;
          }> | null;
        } | null;
        billing_address?: {
          firstname?: string | null;
          lastname?: string | null;
          street?: string[] | null;
          city?: string | null;
          region?: string | null;
          postcode?: string | null;
          country_code?: string | null;
          telephone?: string | null;
        } | null;
        shipping_address?: {
          firstname?: string | null;
          lastname?: string | null;
          street?: string[] | null;
          city?: string | null;
          region?: string | null;
          postcode?: string | null;
          country_code?: string | null;
          telephone?: string | null;
        } | null;
        shipping_method?: string | null;
        payment_methods?: Array<{ name?: string | null }> | null;
        items?: Array<{
          id?: string | number | null;
          product_name?: string | null;
          product_sku?: string | null;
          product_sale_price?: { value?: number | null } | null;
          quantity_ordered?: number | null;
        }> | null;
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
  getOrder(id: number): Promise<OrderDetail>;
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

function parseNumericOrderId(
  value: string | number | null | undefined
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toOrder(order: MagentoOrder): Order {
  const rawId = order.entity_id || order.increment_id || '0';
  const numericId =
    typeof rawId === 'number' ? rawId : Number.parseInt(rawId, 10) || 0;

  return {
    id: numericId,
    number: order.increment_id,
    status: order.status,
    total: order.grand_total,
    currency: order.order_currency_code ?? null,
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
  // GraphQL 的 id 可能是 base64 uid，优先使用 number 生成可访问的详情路由 id
  const numericId =
    parseNumericOrderId(order.number) || parseNumericOrderId(order.id);

  return {
    id: numericId,
    number: order.number ?? '',
    status: order.status ?? '',
    total: order.total?.grand_total?.value ?? 0,
    currency: order.total?.grand_total?.currency ?? null,
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

function toOrderAddress(address: MagentoOrderAddress): OrderAddress {
  const street = Array.isArray(address.street)
    ? address.street.filter(line => line.length > 0).join(', ')
    : address.street ?? '';

  return {
    firstname: address.firstname ?? '',
    lastname: address.lastname ?? '',
    street,
    city: address.city ?? '',
    region: address.region_code ?? '',
    postcode: address.postcode ?? '',
    country: address.country_id ?? '',
    telephone: address.telephone ?? '',
  };
}

function toOrderItem(item: MagentoOrderItem): OrderItem {
  return {
    id: item.item_id,
    name: item.name,
    sku: item.sku,
    price: item.price,
    quantity: item.qty_ordered,
    total: item.row_total,
  };
}

interface MagentoGraphQLOrderAddress {
  firstname?: string | null;
  lastname?: string | null;
  street?: string[] | null;
  city?: string | null;
  region?: string | null;
  postcode?: string | null;
  country_code?: string | null;
  telephone?: string | null;
}

interface MagentoGraphQLOrderItem {
  id?: string | number | null;
  product_name?: string | null;
  product_sku?: string | null;
  product_sale_price?: { value?: number | null } | null;
  quantity_ordered?: number | null;
}

function toOrderAddressFromGraphQL(
  address: MagentoGraphQLOrderAddress
): OrderAddress {
  const street = Array.isArray(address.street)
    ? address.street.filter(line => line && line.length > 0).join(', ')
    : address.street ?? '';

  return {
    firstname: address.firstname ?? '',
    lastname: address.lastname ?? '',
    street,
    city: address.city ?? '',
    region: address.region ?? '',
    postcode: address.postcode ?? '',
    country: address.country_code ?? '',
    telephone: address.telephone ?? '',
  };
}

function toAccountServiceError(error: unknown): AccountServiceError {
  if (error instanceof AccountServiceError) {
    return error;
  }

  if (isMagentoApiError(error)) {
    return new AccountServiceError(
      'MAGENTO_API_ERROR',
      error.status || 502,
      error.message || 'Upstream request failed'
    );
  }

  if (error instanceof MagentoGraphQLError) {
    return new AccountServiceError(
      'MAGENTO_GRAPHQL_ERROR',
      502,
      error.message || 'Magento GraphQL request failed'
    );
  }

  if (error instanceof Error) {
    return new AccountServiceError('INTERNAL_ERROR', 500, error.message);
  }

  return new AccountServiceError(
    'INTERNAL_ERROR',
    500,
    'Internal server error'
  );
}

function toOrderItemFromGraphQL(item: MagentoGraphQLOrderItem): OrderItem {
  const numericId =
    typeof item.id === 'number'
      ? item.id
      : Number.parseInt(item.id ?? '0', 10) || 0;

  return {
    id: numericId,
    name: item.product_name ?? '',
    sku: item.product_sku ?? '',
    price: item.product_sale_price?.value ?? 0,
    quantity: item.quantity_ordered ?? 0,
    total: (item.product_sale_price?.value ?? 0) * (item.quantity_ordered ?? 0),
  };
}

function isEmptyAddress(address: OrderAddress): boolean {
  return (
    !address.firstname &&
    !address.lastname &&
    !address.street &&
    !address.city &&
    !address.country
  );
}

function toOrderDetail(order: MagentoOrderDetail): OrderDetail {
  const shippingAssignment =
    order.extension_attributes?.shipping_assignments?.[0];
  const shippingAddress = shippingAssignment?.shipping?.address;
  const items =
    order.items?.map(toOrderItem) ??
    shippingAssignment?.items?.map(toOrderItem) ??
    [];
  const rawId = order.entity_id || order.increment_id || '0';
  const numericId =
    typeof rawId === 'number' ? rawId : Number.parseInt(rawId, 10) || 0;

  const billingAddress = toOrderAddress(order.billing_address ?? {});
  let shippingAddr = toOrderAddress(shippingAddress ?? {});
  if (isEmptyAddress(shippingAddr)) {
    shippingAddr = billingAddress;
  }

  return {
    id: numericId,
    number: order.increment_id,
    status: order.status,
    total: order.grand_total,
    currency: order.order_currency_code ?? null,
    createdAt: order.created_at,
    items,
    billingAddress,
    shippingAddress: shippingAddr,
    shippingMethod: order.shipping_description ?? '',
    paymentMethod: order.payment?.method ?? '',
    subtotal: order.subtotal ?? 0,
    shippingAmount: order.shipping_amount ?? 0,
    taxAmount: order.tax_amount ?? 0,
    discountAmount: order.discount_amount ?? 0,
  };
}

function toOrderDetailFromGraphQL(
  order: NonNullable<
    NonNullable<
      MagentoCustomerOrderDetailGraphQLResponse['customer']['orders']
    >['items']
  >[number]
): OrderDetail {
  const numericId =
    parseNumericOrderId(order.number) || parseNumericOrderId(order.id);

  const taxAmount =
    order.total?.taxes?.reduce(
      (sum, tax) => sum + (tax.amount?.value ?? 0),
      0
    ) ?? 0;
  const discountAmount =
    order.total?.discounts?.reduce(
      (sum, discount) => sum + (discount.amount?.value ?? 0),
      0
    ) ?? 0;

  const billingAddress = toOrderAddressFromGraphQL(order.billing_address ?? {});
  let shippingAddr = toOrderAddressFromGraphQL(order.shipping_address ?? {});
  if (isEmptyAddress(shippingAddr)) {
    shippingAddr = billingAddress;
  }

  return {
    id: numericId,
    number: order.number ?? '',
    status: order.status ?? '',
    total: order.total?.grand_total?.value ?? 0,
    currency: order.total?.grand_total?.currency ?? null,
    createdAt: order.order_date ?? '',
    items: (order.items ?? []).map(toOrderItemFromGraphQL),
    billingAddress,
    shippingAddress: shippingAddr,
    shippingMethod: order.shipping_method ?? '',
    paymentMethod: order.payment_methods?.[0]?.name ?? '',
    subtotal: order.total?.subtotal?.value ?? 0,
    shippingAmount: order.total?.shipping_handling?.total_amount?.value ?? 0,
    taxAmount,
    discountAmount,
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

      if (isMagentoApiError(error)) {
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
                      currency
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
      throw toAccountServiceError(error);
    }
  }

  async getOrder(id: number): Promise<OrderDetail> {
    try {
      const response = await this.request<MagentoOrderDetail>(`/orders/${id}`);
      return toOrderDetail(response);
    } catch (error) {
      if (
        error instanceof AccountServiceError &&
        error.code === 'UPSTREAM_UNAUTHORIZED'
      ) {
        const query = `
          query GetCustomerOrderDetails {
            customer {
              orders {
                items {
                  id
                  number
                  order_date
                  status
                  total {
                    grand_total {
                      value
                      currency
                    }
                    subtotal {
                      value
                    }
                    shipping_handling {
                      total_amount {
                        value
                      }
                    }
                    taxes {
                      amount {
                        value
                      }
                    }
                    discounts {
                      amount {
                        value
                      }
                    }
                  }
                  billing_address {
                    firstname
                    lastname
                    street
                    city
                    region
                    postcode
                    country_code
                    telephone
                  }
                  shipping_address {
                    firstname
                    lastname
                    street
                    city
                    region
                    postcode
                    country_code
                    telephone
                  }
                  shipping_method
                  payment_methods {
                    name
                  }
                  items {
                    id
                    product_name
                    product_sku
                    product_sale_price {
                      value
                    }
                    quantity_ordered
                  }
                }
              }
            }
          }
        `;

        try {
          const graphqlResponse =
            await authenticatedMagentoGraphQL<MagentoCustomerOrderDetailGraphQLResponse>(
              this.accessToken,
              query
            );
          const items = graphqlResponse.customer.orders?.items ?? [];
          const found = items.find(item => {
            const itemId =
              parseNumericOrderId(item.number) || parseNumericOrderId(item.id);
            return itemId === id;
          });
          if (!found) {
            throw new AccountServiceError(
              'ORDER_NOT_FOUND',
              404,
              'Order not found'
            );
          }
          return toOrderDetailFromGraphQL(found);
        } catch (graphqlError) {
          throw toAccountServiceError(graphqlError);
        }
      }
      throw toAccountServiceError(error);
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
