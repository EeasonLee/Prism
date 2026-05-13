/**
 * Google Tag Manager — Ecommerce DataLayer utilities
 *
 * All events map to the GTM container triggers defined in docs/gtm.json.
 * Events only fire when NEXT_PUBLIC_GTM_CONTAINER_ID is configured.
 */

import { env } from '@/infrastructure/config/env';

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GtmEcommerceItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_variant?: string;
  price?: string | number;
  currency?: string;
  quantity?: number;
  /** List context */
  item_list_name?: string;
  item_list_id?: string;
  index?: number;
  /** Promotion context */
  creative_name?: string;
  creative_slot?: string;
  promotion_id?: string;
  promotion_name?: string;
}

interface GtmUserProperties {
  customerId?: string | number;
  customerGroup?: string;
}

interface GtmEventBase extends GtmUserProperties {
  event: string;
  ecommerce?: Record<string, unknown>;
}

// ─── Guard ───────────────────────────────────────────────────────────────────

const GTM_ENABLED = Boolean(env.NEXT_PUBLIC_GTM_CONTAINER_ID);

/** Debug log for GTM events */
function gtmLog(event: string, data: unknown): void {
  if (
    typeof window !== 'undefined' &&
    (window as Record<string, unknown>).__gtmDebug
  ) {
    console.log('[GTM]', event, data);
  }
}

/** Push to dataLayer only when GTM is enabled */
function gtmPush(data: GtmEventBase): void {
  if (!GTM_ENABLED || typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
  gtmLog(data.event, data);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUserProps(): GtmUserProperties {
  if (typeof window === 'undefined') return {};
  // Attempt to read customer info from any global app state or cookies
  // Fallback: empty — GTM variables will read from dataLayer history
  return {};
}

function buildItemPayload(
  item: GtmEcommerceItem,
  overrides?: Partial<GtmEcommerceItem>
) {
  return {
    ...item,
    ...overrides,
    price:
      typeof item.price === 'number' ? String(item.price) : item.price ?? '',
  };
}

// ─── Ecommerce Events ────────────────────────────────────────────────────────

/**
 * view_item_list — Category / search / recommendation list impressions
 * Trigger: WP - GA4 - view_item_list
 */
export function gtmViewItemList(
  items: GtmEcommerceItem[],
  listName?: string,
  listId?: string
): void {
  gtmPush({
    ...getUserProps(),
    event: 'view_item_list',
    ecommerce: {
      items: items.map((item, index) =>
        buildItemPayload(item, {
          index,
          item_list_name: listName,
          item_list_id: listId,
        })
      ),
    },
  });
}

/**
 * view_item — Product detail page impression
 * Trigger: WP - GA4 - view_item
 */
export function gtmViewItem(item: GtmEcommerceItem): void {
  gtmPush({
    ...getUserProps(),
    event: 'view_item',
    ecommerce: {
      items: [buildItemPayload(item)],
    },
  });
}

/**
 * select_item — Click on a product in a list
 * Trigger: WP - GA4 - select_item
 */
export function gtmSelectItem(
  item: GtmEcommerceItem,
  listName?: string,
  listId?: string
): void {
  gtmPush({
    ...getUserProps(),
    event: 'select_item',
    ecommerce: {
      item_list_name: listName,
      item_list_id: listId,
      items: [
        buildItemPayload(item, {
          item_list_name: listName,
          item_list_id: listId,
        }),
      ],
    },
  });
}

/**
 * add_to_cart — Add product to cart
 * Trigger: WP - GA4 - add_to_cart
 */
export function gtmAddToCart(item: GtmEcommerceItem, quantity = 1): void {
  const payload = buildItemPayload(item, { quantity });
  const priceNum =
    typeof payload.price === 'string'
      ? parseFloat(payload.price)
      : payload.price ?? 0;
  gtmPush({
    ...getUserProps(),
    event: 'add_to_cart',
    ecommerce: {
      currency: payload.currency ?? 'USD',
      value: priceNum * quantity,
      items: [payload],
    },
  });
}

/**
 * remove_from_cart — Remove product from cart
 * Trigger: WP - GA4 - remove_from_cart
 */
export function gtmRemoveFromCart(item: GtmEcommerceItem, quantity = 1): void {
  const payload = buildItemPayload(item, { quantity });
  const priceNum =
    typeof payload.price === 'string'
      ? parseFloat(payload.price)
      : payload.price ?? 0;
  gtmPush({
    ...getUserProps(),
    event: 'remove_from_cart',
    ecommerce: {
      currency: payload.currency ?? 'USD',
      value: priceNum * quantity,
      items: [payload],
    },
  });
}

/**
 * begin_checkout — User clicks "Checkout" button
 * Trigger: WP - GA4 - begin_checkout
 */
export function gtmBeginCheckout(items: GtmEcommerceItem[]): void {
  const totalValue = items.reduce((sum, item) => {
    const priceNum =
      typeof item.price === 'string' ? parseFloat(item.price) : item.price ?? 0;
    return sum + priceNum * (item.quantity ?? 1);
  }, 0);
  gtmPush({
    ...getUserProps(),
    event: 'begin_checkout',
    ecommerce: {
      currency: items[0]?.currency ?? 'USD',
      value: totalValue,
      items: items.map((item, index) => buildItemPayload(item, { index })),
    },
  });
}

/**
 * add_to_wishlist — Add product to wishlist
 * Trigger: WP - GA4 - add_to_wishlist
 */
export function gtmAddToWishlist(item: GtmEcommerceItem): void {
  gtmPush({
    ...getUserProps(),
    event: 'add_to_wishlist',
    ecommerce: {
      items: [buildItemPayload(item)],
    },
  });
}

// ─── Domain mappers ──────────────────────────────────────────────────────────

/** Convert UnifiedProductDisplay → GtmEcommerceItem */
export function mapDisplayToGtmItem(
  product: {
    sku: string;
    name: string;
    short_name?: string | null;
    price: number;
    final_price?: number;
    currency?: string | null;
    url_key?: string | null;
    categories?: string[];
    brand?: string | null;
    image?: string | null;
  },
  options?: {
    index?: number;
    itemListName?: string;
    itemListId?: string;
    quantity?: number;
  }
): GtmEcommerceItem {
  const cats = product.categories ?? [];
  return {
    item_id: product.sku,
    item_name: product.short_name ?? product.name,
    price: product.final_price ?? product.price,
    currency: product.currency ?? 'USD',
    quantity: options?.quantity ?? 1,
    index: options?.index,
    item_list_name: options?.itemListName,
    item_list_id: options?.itemListId,
    item_category: cats[0],
    item_category2: cats[1],
    item_category3: cats[2],
    item_brand: product.brand ?? undefined,
  };
}

/** Convert CartItem → GtmEcommerceItem */
export function mapCartItemToGtmItem(item: {
  sku: string;
  name: string;
  price: number;
  qty: number;
  currency?: string | null;
}): GtmEcommerceItem {
  return {
    item_id: item.sku,
    item_name: item.name,
    price: item.price,
    currency: item.currency ?? 'USD',
    quantity: item.qty,
  };
}
