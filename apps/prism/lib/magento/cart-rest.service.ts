/**
 * Magento REST Cart Service
 *
 * 统一封装 Magento REST API cart 操作
 * 自动处理 guest vs customer 差异
 */

import { magentoRestFetch } from '@/lib/api/bff/magento-rest-client';
import { isMagentoApiError } from '@/lib/api/magento/client';
import {
  authenticatedMagentoGraphQL,
  magentoGraphQLNoCache,
} from '@/lib/services/magento-graphql.client';
import type {
  CartItem,
  CartItemsResponse,
  AddCartItemParams,
  CartTotals,
  CartMoney,
  MagentoProduct,
} from '@/lib/api/magento/types';

function isCustomerCartMissingError(error: unknown): boolean {
  if (!isMagentoApiError(error)) {
    return false;
  }

  return (
    error.status === 404 && error.message.toLowerCase().includes('active cart')
  );
}

interface MagentoCartItem {
  item_id: number;
  sku: string;
  qty: number;
  name: string;
  price: number;
  product_type: string;
  quote_id: string;
  row_total?: number;
  row_total_incl_tax?: number;
  product_option?: {
    extension_attributes?: {
      custom_options?: Array<{
        option_id: string;
        option_value: string;
      }>;
      configurable_item_options?: Array<{
        option_id: string;
        option_value: number;
      }>;
    };
  };
}

interface MagentoTotals {
  grand_total?: number;
  base_grand_total?: number;
  subtotal?: number;
  base_subtotal?: number;
  subtotal_incl_tax?: number;
  base_subtotal_incl_tax?: number;
  discount_amount?: number;
  base_discount_amount?: number;
  coupon_code?: string;
  total_segments?: Array<{
    code?: string;
    title?: string;
    value?: number;
  }>;
  base_currency_code?: string;
  quote_currency_code?: string;
}

interface MagentoCart {
  id: number;
  items: MagentoCartItem[];
  items_count: number;
  items_qty: number;
  customer?: {
    email?: string;
    firstname?: string;
    lastname?: string;
  };
  billing_address?: unknown;
  currency?: {
    base_currency_code?: string;
    quote_currency_code?: string;
    store_currency_code?: string;
  };
  extension_attributes?: {
    shipping_assignments?: unknown[];
  };
}

function withGuestAuthHeader(
  accessToken: string,
  headers: Record<string, string> = {}
): Record<string, string> {
  const token = accessToken.trim();
  if (!token || token.startsWith('guest-local:')) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

function toRecordOfNumbers(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, rawValue]) => [key, Number(rawValue)] as const)
    .filter(([, numValue]) => Number.isFinite(numValue));

  return Object.fromEntries(entries);
}

async function normalizeSuperAttributes(
  accessToken: string,
  sku: string,
  superAttr: Record<string, number>
): Promise<Record<string, number>> {
  const keys = Object.keys(superAttr);
  if (keys.length === 0 || keys.every(key => /^\d+$/.test(key))) {
    return superAttr;
  }

  try {
    const product = await magentoRestFetch<MagentoProduct>(
      `products/${encodeURIComponent(sku)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const configurableOptions =
      product.extension_attributes?.configurable_product_options ??
      product.configurable_options ??
      [];

    const optionKeyToId = new Map<string, string>();
    for (const option of configurableOptions) {
      const optionId = String(option.attribute_id ?? option.id);
      if (!/^\d+$/.test(optionId)) {
        continue;
      }
      if (option.attribute_code) {
        optionKeyToId.set(option.attribute_code, optionId);
      }
      if (option.label) {
        optionKeyToId.set(option.label.toLowerCase(), optionId);
      }
    }

    const normalized: Record<string, number> = {};
    for (const [rawKey, rawValue] of Object.entries(superAttr)) {
      const resolvedKey = /^\d+$/.test(rawKey)
        ? rawKey
        : optionKeyToId.get(rawKey) ??
          optionKeyToId.get(rawKey.toLowerCase()) ??
          rawKey;
      normalized[resolvedKey] = rawValue;
    }
    return normalized;
  } catch {
    const fallback: Record<string, number> = {};
    for (const [key, value] of Object.entries(superAttr)) {
      if (/^\d+$/.test(key)) {
        fallback[key] = value;
      }
    }
    return fallback;
  }
}

function extractCartOptions(
  item: MagentoCartItem
): Array<{ label: string; value: string }> {
  const extensionAttributes = item.product_option?.extension_attributes;
  if (!extensionAttributes) {
    return [];
  }

  const normalized: Array<{ label: string; value: string }> = [];

  for (const option of extensionAttributes.configurable_item_options ?? []) {
    normalized.push({
      label: `Configurable ${option.option_id}`,
      value: String(option.option_value),
    });
  }

  for (const option of extensionAttributes.custom_options ?? []) {
    normalized.push({
      label: `Custom ${option.option_id}`,
      value: option.option_value,
    });
  }

  return normalized;
}

function buildLineMatchKey(
  item: Pick<CartItem, 'sku' | 'name' | 'qty' | 'price'>
): string {
  return `${item.sku}__${item.name}__${item.qty}__${item.price}`;
}

function mergeGraphqlOptions(
  restItems: CartItem[],
  graphqlItems: CartItem[]
): CartItem[] {
  const optionBuckets = new Map<string, Array<CartItem['options']>>();

  for (const gqlItem of graphqlItems) {
    const key = buildLineMatchKey(gqlItem);
    const bucket = optionBuckets.get(key) ?? [];
    bucket.push(gqlItem.options);
    optionBuckets.set(key, bucket);
  }

  return restItems.map(restItem => {
    const key = buildLineMatchKey(restItem);
    const bucket = optionBuckets.get(key);
    if (!bucket || bucket.length === 0) {
      return restItem;
    }
    const nextOptions = bucket.shift();
    return {
      ...restItem,
      options:
        Array.isArray(nextOptions) && nextOptions.length > 0
          ? nextOptions
          : undefined,
    };
  });
}

interface GraphqlCartOptionItem {
  quantity: number;
  product: {
    sku: string;
    name: string;
  };
  prices: {
    price: {
      value: number;
    };
  };
  configurable_options?: Array<{
    option_label: string;
    value_label: string;
  }>;
  customizable_options?: Array<{
    label: string;
    values: Array<{
      label: string;
      value: string;
    }>;
  }>;
}

interface CustomerCartOptionsResponse {
  customerCart: {
    items: GraphqlCartOptionItem[];
  };
}

interface GuestCartOptionsResponse {
  cart: {
    items: GraphqlCartOptionItem[];
  } | null;
}

const CUSTOMER_CART_OPTIONS_QUERY = `
  query CustomerCartOptions {
    customerCart {
      items {
        __typename
        quantity
        product {
          sku
          name
        }
        prices {
          price {
            value
          }
        }
        ... on ConfigurableCartItem {
          configurable_options {
            option_label
            value_label
          }
          customizable_options {
            label
            values {
              label
              value
            }
          }
        }
        ... on SimpleCartItem {
          customizable_options {
            label
            values {
              label
              value
            }
          }
        }
        ... on VirtualCartItem {
          customizable_options {
            label
            values {
              label
              value
            }
          }
        }
        ... on BundleCartItem {
          customizable_options {
            label
            values {
              label
              value
            }
          }
        }
        ... on DownloadableCartItem {
          customizable_options {
            label
            values {
              label
              value
            }
          }
        }
      }
    }
  }
`;

const GUEST_CART_OPTIONS_QUERY = `
  query GuestCartOptions($cartId: String!) {
    cart(cart_id: $cartId) {
      items {
        __typename
        quantity
        product {
          sku
          name
        }
        prices {
          price {
            value
          }
        }
        ... on ConfigurableCartItem {
          configurable_options {
            option_label
            value_label
          }
          customizable_options {
            label
            values {
              label
              value
            }
          }
        }
        ... on SimpleCartItem {
          customizable_options {
            label
            values {
              label
              value
            }
          }
        }
        ... on VirtualCartItem {
          customizable_options {
            label
            values {
              label
              value
            }
          }
        }
        ... on BundleCartItem {
          customizable_options {
            label
            values {
              label
              value
            }
          }
        }
        ... on DownloadableCartItem {
          customizable_options {
            label
            values {
              label
              value
            }
          }
        }
      }
    }
  }
`;

function transformGraphqlOptionItem(item: GraphqlCartOptionItem): CartItem {
  const options: Array<{ label: string; value: string }> = [];
  for (const option of item.configurable_options ?? []) {
    options.push({
      label: option.option_label,
      value: option.value_label,
    });
  }
  for (const option of item.customizable_options ?? []) {
    const value = option.values.map(v => v.value || v.label).join(', ');
    options.push({
      label: option.label,
      value,
    });
  }

  return {
    item_id: '',
    sku: item.product.sku,
    name: item.product.name,
    qty: item.quantity,
    price: item.prices.price.value,
    product_type: '',
    options,
  };
}

async function loadCustomerGraphqlOptionItems(
  accessToken: string
): Promise<CartItem[]> {
  const response =
    await authenticatedMagentoGraphQL<CustomerCartOptionsResponse>(
      accessToken,
      CUSTOMER_CART_OPTIONS_QUERY
    );
  return (response.customerCart.items ?? []).map(transformGraphqlOptionItem);
}

async function loadGuestGraphqlOptionItems(
  cartId: string
): Promise<CartItem[]> {
  const response = await magentoGraphQLNoCache<GuestCartOptionsResponse>(
    GUEST_CART_OPTIONS_QUERY,
    { cartId }
  );
  return (response.cart?.items ?? []).map(transformGraphqlOptionItem);
}

/**
 * 创建 guest cart，返回 cart ID (masked quote ID)
 */
export async function createGuestCart(accessToken: string): Promise<string> {
  const cartId = await magentoRestFetch<string>('guest-carts', {
    method: 'POST',
    headers: withGuestAuthHeader(accessToken),
  });
  return cartId;
}

/**
 * 确保 customer 有 cart，并返回内部 quote id（数字字符串）。
 */
export async function ensureCustomerCartQuoteId(
  accessToken: string
): Promise<string> {
  const quoteId = await magentoRestFetch<number | string>('carts/mine', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return String(quoteId);
}

/**
 * 转换 Magento totals 为前端格式
 */
function transformTotals(
  totals: MagentoTotals | undefined,
  currency: string
): CartTotals | null {
  if (!totals) return null;

  const money = (value: number | undefined): CartMoney | null =>
    typeof value === 'number' ? { value, currency } : null;
  const discountSegment = totals.total_segments?.find(
    segment => segment.code === 'discount'
  );
  const discountValue =
    totals.discount_amount ??
    totals.base_discount_amount ??
    discountSegment?.value;
  const couponCode =
    typeof totals.coupon_code === 'string' && totals.coupon_code.length > 0
      ? totals.coupon_code
      : null;
  const discountReason =
    typeof discountSegment?.title === 'string' &&
    discountSegment.title.length > 0
      ? discountSegment.title
      : discountValue !== undefined
      ? 'Discount'
      : null;

  return {
    grand_total: money(totals.grand_total),
    grand_total_excluding_tax: null,
    subtotal_excluding_tax: money(totals.subtotal),
    subtotal_including_tax: money(totals.subtotal_incl_tax),
    discount: money(discountValue),
    coupon_code: couponCode,
    discount_reason: discountReason,
  };
}

/**
 * 获取 guest 完整购物车
 */
export async function getGuestCart(
  accessToken: string,
  cartId: string
): Promise<CartItemsResponse> {
  // 获取 cart items
  const items = await magentoRestFetch<MagentoCartItem[]>(
    `guest-carts/${cartId}/items`,
    { headers: withGuestAuthHeader(accessToken) }
  );

  // 获取 totals
  let totals: CartTotals | null = null;
  let cartCurrency: string | null = null;
  try {
    const magentoTotals = await magentoRestFetch<MagentoTotals>(
      `guest-carts/${cartId}/totals`,
      { headers: withGuestAuthHeader(accessToken) }
    );
    const currency =
      magentoTotals.quote_currency_code ??
      magentoTotals.base_currency_code ??
      'USD';
    cartCurrency = currency;
    totals = transformTotals(magentoTotals, currency);
  } catch {
    // totals 获取失败不影响主流程
  }

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  const restSnapshot: CartItemsResponse = {
    cart_id: cartId,
    items_count: items.length,
    total_quantity: totalQty,
    items: items.map(item => transformCartItem(item, cartCurrency)),
    totals,
  };

  try {
    const gqlItems = await loadGuestGraphqlOptionItems(cartId);
    return {
      ...restSnapshot,
      items: mergeGraphqlOptions(restSnapshot.items, gqlItems),
    };
  } catch {
    return restSnapshot;
  }
}

/**
 * 获取 customer 完整购物车
 */
export async function getCustomerCart(
  accessToken: string
): Promise<CartItemsResponse> {
  let items: MagentoCartItem[];
  try {
    items = await magentoRestFetch<MagentoCartItem[]>('carts/mine/items', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    if (!isCustomerCartMissingError(error)) {
      throw error;
    }
    await ensureCustomerCartQuoteId(accessToken);
    items = [];
  }

  // 获取 totals
  let totals: CartTotals | null = null;
  let cartCurrency: string | null = null;
  try {
    const magentoTotals = await magentoRestFetch<MagentoTotals>(
      'carts/mine/totals',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const currency =
      magentoTotals.quote_currency_code ??
      magentoTotals.base_currency_code ??
      'USD';
    cartCurrency = currency;
    totals = transformTotals(magentoTotals, currency);
  } catch {
    // totals 获取失败不影响主流程
  }

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const customerCartIdFromItems = items.find(item => item.quote_id)?.quote_id;
  const customerCartId =
    customerCartIdFromItems && customerCartIdFromItems.length > 0
      ? customerCartIdFromItems
      : await ensureCustomerCartQuoteId(accessToken);

  const restSnapshot: CartItemsResponse = {
    cart_id: customerCartId,
    items_count: items.length,
    total_quantity: totalQty,
    items: items.map(item => transformCartItem(item, cartCurrency)),
    totals,
  };

  try {
    const gqlItems = await loadCustomerGraphqlOptionItems(accessToken);
    return {
      ...restSnapshot,
      items: mergeGraphqlOptions(restSnapshot.items, gqlItems),
    };
  } catch {
    return restSnapshot;
  }
}

/**
 * 添加商品到 guest cart
 */
export async function addGuestCartItem(
  accessToken: string,
  cartId: string,
  params: AddCartItemParams
): Promise<CartItem> {
  const cartItem: Record<string, unknown> = {
    sku: params.sku,
    qty: params.qty,
    quote_id: cartId,
  };

  // 处理 product options
  if (params.productOptionsJson) {
    try {
      const options = JSON.parse(params.productOptionsJson) as Record<
        string,
        unknown
      >;
      const productOption: Record<string, unknown> = {};

      if (
        options.super_attribute &&
        typeof options.super_attribute === 'object'
      ) {
        const superAttr = toRecordOfNumbers(options.super_attribute);
        const normalizedSuperAttr = await normalizeSuperAttributes(
          accessToken,
          params.sku,
          superAttr
        );
        const configurableItemOptions = Object.entries(normalizedSuperAttr).map(
          ([optionId, value]) => ({
            option_id: optionId,
            option_value: value,
          })
        );
        if (configurableItemOptions.length > 0) {
          productOption.extension_attributes = {
            configurable_item_options: configurableItemOptions,
          };
        }
      }

      if (Array.isArray(options.custom_options)) {
        if (!productOption.extension_attributes) {
          productOption.extension_attributes = {};
        }
        (
          productOption.extension_attributes as Record<string, unknown>
        ).custom_options = options.custom_options;
      }

      if (Object.keys(productOption).length > 0) {
        cartItem.product_option = productOption;
      }
    } catch {
      // JSON 解析失败，忽略 options
    }
  }

  const item = await magentoRestFetch<MagentoCartItem>(
    `guest-carts/${cartId}/items`,
    {
      method: 'POST',
      headers: withGuestAuthHeader(accessToken, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ cartItem }),
    }
  );

  return transformCartItem(item);
}

/**
 * 添加商品到 customer cart
 */
export async function addCustomerCartItem(
  accessToken: string,
  params: AddCartItemParams
): Promise<CartItem> {
  const cartItem: Record<string, unknown> = {
    sku: params.sku,
    qty: params.qty,
  };

  // 处理 product options (同 guest)
  if (params.productOptionsJson) {
    try {
      const options = JSON.parse(params.productOptionsJson) as Record<
        string,
        unknown
      >;
      const productOption: Record<string, unknown> = {};

      if (
        options.super_attribute &&
        typeof options.super_attribute === 'object'
      ) {
        const superAttr = toRecordOfNumbers(options.super_attribute);
        const normalizedSuperAttr = await normalizeSuperAttributes(
          accessToken,
          params.sku,
          superAttr
        );
        const configurableItemOptions = Object.entries(normalizedSuperAttr).map(
          ([optionId, value]) => ({
            option_id: optionId,
            option_value: value,
          })
        );
        if (configurableItemOptions.length > 0) {
          productOption.extension_attributes = {
            configurable_item_options: configurableItemOptions,
          };
        }
      }

      if (Array.isArray(options.custom_options)) {
        if (!productOption.extension_attributes) {
          productOption.extension_attributes = {};
        }
        (
          productOption.extension_attributes as Record<string, unknown>
        ).custom_options = options.custom_options;
      }

      if (Object.keys(productOption).length > 0) {
        cartItem.product_option = productOption;
      }
    } catch {
      // JSON 解析失败，忽略 options
    }
  }

  let item: MagentoCartItem;
  try {
    item = await magentoRestFetch<MagentoCartItem>('carts/mine/items', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cartItem }),
    });
  } catch (error) {
    if (!isCustomerCartMissingError(error)) {
      throw error;
    }

    await ensureCustomerCartQuoteId(accessToken);
    item = await magentoRestFetch<MagentoCartItem>('carts/mine/items', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cartItem }),
    });
  }

  return transformCartItem(item);
}

/**
 * 更新 guest cart item 数量
 */
export async function updateGuestCartItem(
  accessToken: string,
  cartId: string,
  itemId: number,
  qty: number
): Promise<CartItem> {
  const item = await magentoRestFetch<MagentoCartItem>(
    `guest-carts/${cartId}/items/${itemId}`,
    {
      method: 'PUT',
      headers: withGuestAuthHeader(accessToken, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        cartItem: {
          item_id: itemId,
          qty,
          quote_id: cartId,
        },
      }),
    }
  );

  return transformCartItem(item);
}

/**
 * 更新 customer cart item 数量
 */
export async function updateCustomerCartItem(
  accessToken: string,
  itemId: number,
  qty: number
): Promise<CartItem> {
  const item = await magentoRestFetch<MagentoCartItem>(
    `carts/mine/items/${itemId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cartItem: {
          item_id: itemId,
          qty,
        },
      }),
    }
  );

  return transformCartItem(item);
}

/**
 * 删除 guest cart item
 */
export async function removeGuestCartItem(
  accessToken: string,
  cartId: string,
  itemId: number
): Promise<void> {
  await magentoRestFetch<boolean>(`guest-carts/${cartId}/items/${itemId}`, {
    method: 'DELETE',
    headers: withGuestAuthHeader(accessToken),
  });
}

/**
 * 删除 customer cart item
 */
export async function removeCustomerCartItem(
  accessToken: string,
  itemId: number
): Promise<void> {
  await magentoRestFetch<boolean>(`carts/mine/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * 清空 guest cart
 */
export async function clearGuestCart(
  accessToken: string,
  cartId: string
): Promise<void> {
  const items = await magentoRestFetch<MagentoCartItem[]>(
    `guest-carts/${cartId}/items`,
    { headers: withGuestAuthHeader(accessToken) }
  );

  await Promise.all(
    items.map(item => removeGuestCartItem(accessToken, cartId, item.item_id))
  );
}

/**
 * 清空 customer cart
 */
export async function clearCustomerCart(accessToken: string): Promise<void> {
  let items: MagentoCartItem[];
  try {
    items = await magentoRestFetch<MagentoCartItem[]>('carts/mine/items', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    if (!isCustomerCartMissingError(error)) {
      throw error;
    }
    return;
  }

  await Promise.all(
    items.map(item => removeCustomerCartItem(accessToken, item.item_id))
  );
}

/**
 * 获取 guest cart ID (从 Magento REST API)
 */
export async function getGuestCartId(
  accessToken: string,
  existingCartId?: string
): Promise<string> {
  if (existingCartId) {
    // 验证 cart ID 是否有效
    try {
      await getGuestCart(accessToken, existingCartId);
      return existingCartId;
    } catch {
      // Cart ID 无效，创建新的
    }
  }

  return createGuestCart(accessToken);
}

/**
 * 将 guest masked cart id 解析为 Magento 内部 quote id（数字字符串）。
 * App/Sso 的 redirect 逻辑会把 cart_id 强转 int，因此必须尽量传内部 quote id。
 */
export async function resolveGuestQuoteId(
  accessToken: string,
  maskedCartId: string
): Promise<string> {
  // 1) 优先走 guest-carts/{maskedId}，通常可直接拿到 quote id
  try {
    const cart = await magentoRestFetch<MagentoCart>(
      `guest-carts/${maskedCartId}`,
      { headers: withGuestAuthHeader(accessToken) }
    );
    if (
      typeof cart.id === 'number' &&
      Number.isFinite(cart.id) &&
      cart.id > 0
    ) {
      return String(cart.id);
    }
  } catch {
    // 忽略，降级到 items 兜底
  }

  // 2) 从 items[].quote_id 兜底提取（有商品时最稳定）
  try {
    const items = await magentoRestFetch<MagentoCartItem[]>(
      `guest-carts/${maskedCartId}/items`,
      { headers: withGuestAuthHeader(accessToken) }
    );
    const quoteId = items.find(item =>
      /^\d+$/.test(String(item.quote_id))
    )?.quote_id;
    if (quoteId) {
      return String(quoteId);
    }
  } catch {
    // 保持最后回退
  }

  // 3) 回退原值，避免中断流程（上游可继续报更明确错误）
  return maskedCartId;
}

/**
 * 为 guest cart 应用 coupon code
 */
export async function applyGuestCoupon(
  accessToken: string,
  cartId: string,
  couponCode: string
): Promise<boolean> {
  const result = await magentoRestFetch<boolean>(
    `guest-carts/${cartId}/coupons/${encodeURIComponent(couponCode)}`,
    {
      method: 'PUT',
      headers: withGuestAuthHeader(accessToken),
    }
  );
  return result;
}

/**
 * 为 customer cart 应用 coupon code
 */
export async function applyCustomerCoupon(
  accessToken: string,
  couponCode: string
): Promise<boolean> {
  const result = await magentoRestFetch<boolean>(
    `carts/mine/coupons/${encodeURIComponent(couponCode)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return result;
}

/**
 * 移除 guest cart coupon
 */
export async function removeGuestCoupon(
  accessToken: string,
  cartId: string
): Promise<void> {
  await magentoRestFetch<boolean>(`guest-carts/${cartId}/coupons`, {
    method: 'DELETE',
    headers: withGuestAuthHeader(accessToken),
  });
}

/**
 * 移除 customer cart coupon
 */
export async function removeCustomerCoupon(accessToken: string): Promise<void> {
  await magentoRestFetch<boolean>('carts/mine/coupons', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * 转换 Magento cart item 为前端格式
 */
function transformCartItem(
  item: MagentoCartItem,
  fallbackCurrency?: string | null
): CartItem {
  const options = extractCartOptions(item);
  return {
    item_id: String(item.item_id),
    sku: item.sku,
    qty: item.qty,
    name: item.name,
    price: item.price,
    product_type: item.product_type,
    quote_id: item.quote_id,
    currency: fallbackCurrency ?? 'USD',
    options: options.length > 0 ? options : undefined,
  };
}
