/**
 * Magento GraphQL Cart Service
 *
 * 封装 Magento GraphQL cart 操作，提供与现有 REST API 兼容的接口
 */

import {
  authenticatedMagentoGraphQL,
  magentoGraphQLNoCache,
} from '../services/magento-graphql.client';
import type {
  AddCartItemParams,
  CartItem,
  CartItemsResponse,
  CartLineOption,
  CartMoney,
  CartTotals,
} from '../api/magento/types';
import type {
  CreateEmptyCartResponse,
  CustomerCartResponse,
  AddProductsToCartResponse,
  UpdateCartItemsResponse,
  RemoveItemFromCartResponse,
  CartQueryResponse,
  CartItemInterface,
  CartPricesGraphql,
} from './graphql/cart-types';
import {
  CREATE_EMPTY_CART,
  CUSTOMER_CART,
  GET_CART,
  ADD_PRODUCTS_TO_CART,
  UPDATE_CART_ITEMS,
  REMOVE_ITEM_FROM_CART,
} from './graphql/cart-operations';
import { processProductImageUrl } from '@prism/shared';

function mapCartLineTypename(typename: string | undefined): string {
  switch (typename) {
    case 'SimpleCartItem':
      return 'simple';
    case 'VirtualCartItem':
      return 'virtual';
    case 'ConfigurableCartItem':
      return 'configurable';
    case 'BundleCartItem':
      return 'bundle';
    case 'DownloadableCartItem':
      return 'downloadable';
    default:
      return 'unknown';
  }
}

function collectLineOptions(item: CartItemInterface): CartLineOption[] {
  const out: CartLineOption[] = [];
  if (Array.isArray(item.configurable_options)) {
    for (const o of item.configurable_options) {
      out.push({ label: o.option_label, value: o.value_label });
    }
  }
  if (Array.isArray(item.customizable_options)) {
    for (const o of item.customizable_options) {
      const value = o.values
        .map(v => (v.value.trim().length > 0 ? v.value : v.label))
        .filter(s => s.length > 0)
        .join(', ');
      out.push({ label: o.label, value: value.length > 0 ? value : '—' });
    }
  }
  return out;
}

function transformMoney(
  m: { value?: number; currency?: string } | null | undefined
): CartMoney | null {
  if (m === null || m === undefined || typeof m.value !== 'number') {
    return null;
  }
  return {
    value: m.value,
    currency:
      typeof m.currency === 'string' && m.currency.length > 0
        ? m.currency
        : 'USD',
  };
}

function transformCartPrices(
  prices: CartPricesGraphql | null | undefined
): CartTotals | null {
  if (!prices) {
    return null;
  }
  return {
    grand_total: transformMoney(prices.grand_total),
    grand_total_excluding_tax: transformMoney(prices.grand_total_excluding_tax),
    subtotal_excluding_tax: transformMoney(prices.subtotal_excluding_tax),
    subtotal_including_tax: transformMoney(prices.subtotal_including_tax),
    discount: null,
    coupon_code: null,
    discount_reason: null,
  };
}

/**
 * 将 GraphQL CartItemInterface 转换为 BFF CartItem
 */
function transformCartItem(item: CartItemInterface): CartItem {
  const options = collectLineOptions(item);
  const rowCurrency =
    item.prices.row_total.currency ??
    item.prices.price.currency ??
    item.product.price_range.minimum_price.regular_price.currency;

  return {
    item_id: item.uid,
    sku: item.product.sku,
    name: item.product.name,
    qty: item.quantity,
    price: item.prices.price.value,
    row_total: item.prices.row_total.value,
    row_total_including_tax: item.prices.row_total_including_tax?.value,
    currency: rowCurrency,
    product_type: mapCartLineTypename(item.__typename),
    options: options.length > 0 ? options : undefined,
    thumbnail:
      processProductImageUrl(item.product.thumbnail?.url) ??
      item.product.thumbnail?.url,
  };
}

/**
 * 执行 cart GraphQL 操作，有 cartId 时用无认证调用，否则用认证调用
 */
async function cartGraphQL<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
  hasCartId?: boolean
): Promise<T> {
  if (hasCartId) {
    return magentoGraphQLNoCache<T>(query, variables);
  }
  return authenticatedMagentoGraphQL<T>(accessToken, query, variables);
}

/**
 * 获取购物车 ID（优先使用传入的 cartId）
 */
export async function getCartId(
  accessToken: string,
  existingCartId?: string
): Promise<string> {
  if (existingCartId) {
    return existingCartId;
  }

  try {
    const response = await authenticatedMagentoGraphQL<CustomerCartResponse>(
      accessToken,
      CUSTOMER_CART
    );
    return response.customerCart.id;
  } catch {
    const createResponse = await magentoGraphQLNoCache<CreateEmptyCartResponse>(
      CREATE_EMPTY_CART
    );
    return createResponse.createEmptyCart;
  }
}

/**
 * 获取购物车内容
 */
export async function getCart(
  accessToken: string,
  existingCartId?: string
): Promise<CartItemsResponse> {
  const cartId = await getCartId(accessToken, existingCartId);

  const cartResponse = await cartGraphQL<CartQueryResponse>(
    accessToken,
    GET_CART,
    { cartId },
    !!existingCartId
  );

  const cart = cartResponse.cart;
  if (!cart) {
    throw new Error('Cart not found');
  }

  return {
    cart_id: cartId,
    items_count: cart.items.length,
    total_quantity: cart.total_quantity,
    items: cart.items.map(transformCartItem),
    totals: transformCartPrices(cart.prices),
  };
}

/**
 * 添加商品到购物车
 */
export async function addItemToCart(
  accessToken: string,
  params: AddCartItemParams,
  existingCartId?: string
): Promise<CartItem & { cart_id: string }> {
  const cartId = await getCartId(accessToken, existingCartId);

  // 构建 cart item input
  const cartItemInput: Record<string, unknown> = {
    sku: params.sku,
    quantity: params.qty,
  };

  // 处理 productOptionsJson（configurable options / custom options）
  if (params.productOptionsJson) {
    try {
      const options = JSON.parse(params.productOptionsJson) as Record<
        string,
        unknown
      >;

      // super_attribute → selected_options (configurable products)
      if (
        options.super_attribute &&
        typeof options.super_attribute === 'object'
      ) {
        const superAttr = options.super_attribute as Record<string, string>;
        cartItemInput.selected_options = Object.values(superAttr);
      }

      // custom_options → entered_options
      if (Array.isArray(options.custom_options)) {
        cartItemInput.entered_options = (
          options.custom_options as Array<{
            option_id: string;
            option_value: string;
          }>
        ).map(opt => ({
          uid: opt.option_id,
          value: String(opt.option_value),
        }));
      }
    } catch {
      // JSON 解析失败，忽略 options
    }
  }

  const response = await cartGraphQL<AddProductsToCartResponse>(
    accessToken,
    ADD_PRODUCTS_TO_CART,
    {
      cartId,
      cartItems: [cartItemInput],
    },
    !!existingCartId
  );

  if (response.addProductsToCart.user_errors.length > 0) {
    throw new Error(response.addProductsToCart.user_errors[0].message);
  }

  const addedItem = response.addProductsToCart.cart.items.find(
    item => item.product.sku === params.sku
  );

  if (!addedItem) {
    // 如果找不到精确匹配，取最后一个
    const lastItem =
      response.addProductsToCart.cart.items[
        response.addProductsToCart.cart.items.length - 1
      ];
    if (!lastItem) {
      throw new Error('Failed to add item to cart');
    }
    return { ...transformCartItem(lastItem), cart_id: cartId };
  }

  return { ...transformCartItem(addedItem), cart_id: cartId };
}

/**
 * 更新购物车商品数量
 */
export async function updateCartItem(
  accessToken: string,
  itemUid: string,
  qty: number,
  existingCartId?: string
): Promise<CartItem> {
  const cartId = await getCartId(accessToken, existingCartId);

  const updateResponse = await cartGraphQL<UpdateCartItemsResponse>(
    accessToken,
    UPDATE_CART_ITEMS,
    {
      cartId,
      cartItems: [
        {
          cart_item_uid: itemUid,
          quantity: qty,
        },
      ],
    },
    !!existingCartId
  );

  const updatedItem = updateResponse.updateCartItems.cart.items.find(
    item => item.uid === itemUid
  );

  if (!updatedItem) {
    throw new Error('Item not found after update');
  }

  return transformCartItem(updatedItem);
}

/**
 * 从购物车删除商品
 */
export async function removeCartItem(
  accessToken: string,
  itemUid: string,
  existingCartId?: string
): Promise<void> {
  const cartId = await getCartId(accessToken, existingCartId);

  await cartGraphQL<RemoveItemFromCartResponse>(
    accessToken,
    REMOVE_ITEM_FROM_CART,
    {
      cartId,
      cartItemUid: itemUid,
    },
    !!existingCartId
  );
}

/**
 * 清空购物车
 */
export async function clearCart(
  accessToken: string,
  existingCartId?: string
): Promise<void> {
  const cartId = await getCartId(accessToken, existingCartId);

  const cartResponse = await cartGraphQL<CartQueryResponse>(
    accessToken,
    GET_CART,
    { cartId },
    !!existingCartId
  );

  const quote = cartResponse.cart;
  if (!quote) {
    return;
  }

  const items = quote.items;

  // GraphQL 没有 clearCart mutation，需要逐个删除
  for (const item of items) {
    await authenticatedMagentoGraphQL<RemoveItemFromCartResponse>(
      accessToken,
      REMOVE_ITEM_FROM_CART,
      {
        cartId,
        cartItemUid: item.uid,
      }
    );
  }
}
