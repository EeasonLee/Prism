'use client';

import { useEffect, useRef, useState } from 'react';
import { buildProductUrl } from '@/features/product';
import type { CartItem } from '../types';

export interface CartEnrichmentData {
  sku: string;
  name: string;
  image: string | null;
  url_key: string | null;
  configurable_options: Array<{
    attribute_id: string;
    attribute_code: string;
    label: string;
    values: Array<{ value_index: string; label: string }>;
  }>;
  custom_options: Array<{
    option_id: number;
    title: string;
    type: string;
    required: boolean;
    values?: Array<{
      option_type_id: number;
      title: string;
      price: number;
      price_type: string;
      sku: string;
      sort_order: number;
    }>;
  }>;
  parent_sku: string | null;
  parent_url: string | null;
  parent_configurable_options: Array<{
    attribute_id: string;
    attribute_code: string;
    label: string;
    values: Array<{ value_index: string; label: string }>;
  }> | null;
  parent_custom_options: Array<{
    option_id: number;
    title: string;
    type: string;
    required: boolean;
    values?: Array<{
      option_type_id: number;
      title: string;
      price: number;
      price_type: string;
      sku: string;
      sort_order: number;
    }>;
  }> | null;
  variants: Array<{
    sku: string;
    price: number;
    final_price: number;
    is_in_stock: boolean;
    image_url: string | null;
    option_values: Record<string, string>;
  }>;
  inventory?: {
    salable_qty: number;
    is_salable: boolean;
    stock_status: string;
  } | null;
}

export interface ResolvedCartOption {
  label: string;
  value: string;
}

export interface ResolvedCartItemView {
  imageUrl: string | null;
  productUrl: string;
  options: ResolvedCartOption[];
  stockWarning: string | null;
}

function normalizeCartSku(sku: string): string {
  const commaIdx = sku.indexOf(',');
  return commaIdx > 0 ? sku.slice(0, commaIdx).trim() : sku.trim();
}

function buildOptionLabelMap(
  enrichment: CartEnrichmentData | undefined
): Record<string, string> | null {
  const source = enrichment?.configurable_options?.length
    ? enrichment.configurable_options
    : enrichment?.parent_configurable_options?.length
    ? enrichment.parent_configurable_options
    : [];
  if (source.length === 0) return null;
  const map: Record<string, string> = {};
  for (const opt of source) {
    for (const v of opt.values) {
      map[v.value_index] = v.label;
    }
  }
  return map;
}

function buildCustomOptionLabelMap(
  enrichment: CartEnrichmentData | undefined
): Record<string, { title: string; values: Record<string, string> }> | null {
  const source = enrichment?.custom_options?.length
    ? enrichment.custom_options
    : enrichment?.parent_custom_options?.length
    ? enrichment.parent_custom_options
    : [];
  if (source.length === 0) return null;
  const map: Record<string, { title: string; values: Record<string, string> }> =
    {};
  for (const opt of source) {
    const valueMap: Record<string, string> = {};
    for (const v of opt.values ?? []) {
      valueMap[String(v.option_type_id)] = v.title;
    }
    map[String(opt.option_id)] = { title: opt.title, values: valueMap };
  }
  return map;
}

function findVariantImage(
  enrichment: CartEnrichmentData | undefined,
  cartOptions: Array<{ label: string; value: string }> | undefined
): string | null {
  if (!enrichment || enrichment.variants.length === 0) return null;

  const selectedValues: Record<string, string> = {};
  for (const opt of cartOptions ?? []) {
    selectedValues[opt.label] = opt.value;
  }

  for (const variant of enrichment.variants) {
    const variantValues = variant.option_values ?? {};
    let match = true;
    for (const [key, val] of Object.entries(selectedValues)) {
      if (variantValues[key] !== val) {
        match = false;
        break;
      }
    }
    if (match && variant.image_url) {
      return variant.image_url;
    }
  }

  return null;
}

function resolveOptions(
  item: CartItem,
  enrichment: CartEnrichmentData | undefined
): ResolvedCartOption[] {
  const optionLabelMap = buildOptionLabelMap(enrichment);
  const customOptionLabelMap = buildCustomOptionLabelMap(enrichment);

  return (item.options ?? []).map(opt => {
    const isConfigurable =
      /^\d+$/.test(opt.label) || opt.label.startsWith('Configurable ');
    const isCustom = opt.label.startsWith('Custom ');

    let resolvedLabel = opt.label;
    let resolvedValue = opt.value;

    if (isConfigurable && optionLabelMap) {
      resolvedValue = optionLabelMap[opt.value] ?? opt.value;
      const attrId = opt.label.replace('Configurable ', '').trim();
      const allConfigurableOpts = [
        ...(enrichment?.configurable_options ?? []),
        ...(enrichment?.parent_configurable_options ?? []),
      ];
      const configOpt = allConfigurableOpts.find(
        co => co.attribute_id === attrId || co.attribute_code === attrId
      );
      if (configOpt) {
        resolvedLabel = configOpt.label;
      }
    }

    if (isCustom && customOptionLabelMap) {
      const customOptId = opt.label.replace('Custom ', '');
      const customOpt = customOptionLabelMap[customOptId];
      if (customOpt) {
        resolvedLabel = customOpt.title;
        const valueIds = opt.value.split(',').map(v => v.trim());
        resolvedValue = valueIds
          .map(vid => customOpt.values[vid] ?? vid)
          .filter(Boolean)
          .join(', ');
      }
    }

    return {
      label: resolvedLabel,
      value: resolvedValue,
    };
  });
}

export function getCartItemStockWarning(
  item: CartItem,
  enrichment: CartEnrichmentData | null | undefined
): string | null {
  const stock = enrichment?.inventory;
  const isOutOfStock = stock && !stock.is_salable;
  const isOverQty =
    stock && stock.salable_qty > 0 && item.qty > stock.salable_qty;

  if (isOutOfStock) return 'The requested qty is not available';
  if (isOverQty) {
    return `The requested qty is not available (max ${stock.salable_qty})`;
  }
  return null;
}

export function sortCartItemsByStock(
  items: CartItem[],
  enrichment: Record<string, CartEnrichmentData | null>
): CartItem[] {
  return items.slice().sort((a, b) => {
    const aBad = getCartItemStockWarning(a, enrichment[a.sku]);
    const bBad = getCartItemStockWarning(b, enrichment[b.sku]);
    if (aBad && !bBad) return -1;
    if (!aBad && bBad) return 1;
    return 0;
  });
}

export function resolveCartItemView(
  item: CartItem,
  enrichment: CartEnrichmentData | null | undefined
): ResolvedCartItemView {
  const variantImage = findVariantImage(enrichment ?? undefined, item.options);
  const imageUrl = variantImage ?? enrichment?.image ?? item.thumbnail ?? null;
  const productUrl = buildProductUrl({
    url_key: enrichment?.url_key ?? null,
    sku: item.sku,
    cp_code: null,
  });

  return {
    imageUrl,
    productUrl,
    options: resolveOptions(item, enrichment ?? undefined),
    stockWarning: getCartItemStockWarning(item, enrichment),
  };
}

export function useCartEnrichment(items: CartItem[]) {
  const [enrichment, setEnrichment] = useState<
    Record<string, CartEnrichmentData | null>
  >({});
  const cacheRef = useRef<Record<string, CartEnrichmentData | null>>({});

  useEffect(() => {
    if (items.length === 0) {
      setEnrichment({});
      return;
    }

    const rawToNormalized = new Map<string, string>();
    for (const item of items) {
      if (!item.sku) continue;
      rawToNormalized.set(item.sku, normalizeCartSku(item.sku));
    }
    const normalizedSet = new Set(rawToNormalized.values());
    const uncached = [...normalizedSet].filter(
      sku => !(sku in cacheRef.current)
    );

    const cachedMap: Record<string, CartEnrichmentData | null> = {};
    for (const [raw, normalized] of rawToNormalized) {
      cachedMap[raw] = cacheRef.current[normalized] ?? null;
    }
    setEnrichment(cachedMap);

    let cancelled = false;

    const fetchInventoryBatch = async (skus: string[]) => {
      if (skus.length === 0) return;
      try {
        const res = await fetch('/api/inventory/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skus }),
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          success: boolean;
          data?: {
            items?: Record<
              string,
              {
                sku: string;
                salable_qty: number;
                is_salable: boolean;
                stock_status: string;
              }
            >;
            not_found?: string[];
          };
        };

        if (!json.success || !json.data) return;

        const inventoryMap = json.data.items ?? {};
        const notFound = new Set(json.data.not_found ?? []);

        setEnrichment(prev => {
          const next: Record<string, CartEnrichmentData | null> = { ...prev };
          for (const [raw, normalized] of rawToNormalized) {
            const existing = next[raw];
            if (!existing) continue;

            if (inventoryMap[normalized]) {
              next[raw] = {
                ...existing,
                inventory: {
                  salable_qty: inventoryMap[normalized].salable_qty,
                  is_salable: inventoryMap[normalized].is_salable,
                  stock_status: inventoryMap[normalized].stock_status,
                },
              };
            } else if (notFound.has(normalized)) {
              next[raw] = {
                ...existing,
                inventory: {
                  salable_qty: 0,
                  is_salable: false,
                  stock_status: 'out_of_stock',
                },
              };
            }
          }
          return next;
        });
      } catch {
        // Inventory fetch is best-effort; don't block cart rendering.
      }
    };

    if (uncached.length === 0) {
      void fetchInventoryBatch([...normalizedSet]);
      return () => {
        cancelled = true;
      };
    }

    const fetchAll = async () => {
      try {
        const res = await fetch(
          `/api/products?skus=${uncached
            .map(s => encodeURIComponent(s))
            .join(',')}`
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          success: boolean;
          data?: Record<string, CartEnrichmentData | null>;
        };
        if (!json.success || !json.data) return;

        Object.assign(cacheRef.current, json.data);

        if (cancelled) return;
        const merged: Record<string, CartEnrichmentData | null> = {};
        for (const [raw, normalized] of rawToNormalized) {
          merged[raw] = cacheRef.current[normalized] ?? null;
        }
        setEnrichment(merged);

        await fetchInventoryBatch([...normalizedSet]);
      } catch {
        // Serve from cache on error.
      }
    };

    void fetchAll();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return enrichment;
}
