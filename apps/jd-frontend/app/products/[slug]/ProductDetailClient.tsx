'use client';

import { OptimizedImage } from '@prism/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import type {
  MagentoConfigurableOption,
  MagentoMediaGalleryItem,
  MagentoProduct,
  MagentoCustomizableOption,
} from '../../../lib/api/magento/types';
import { formatPrice } from '@prism/shared';
import { AddToCartButton } from '@/features/product';
import { CustomizableOptionsSection } from '@/features/product';

export interface SelectedVariantProduct {
  sku: string;
  name: string;
  cp_label?: string | null;
  cp_code?: string | null;
  cp_date?: string | null;
  /** 与 cp_code 对应的可抵扣金额 */
  cp_price?: number | null;
  price: number;
  special_price?: number | null;
  stock_qty?: number | null;
  stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
  is_in_stock?: boolean;
  media_gallery?: MagentoMediaGalleryItem[];
}

export interface ProductDetailSelection {
  selectedVariant: SelectedVariantProduct | null;
  allSelected: boolean;
  customOptionPriceDelta: number;
}

interface ProductDetailClientProps {
  product: MagentoProduct;
  claimedCouponCode?: string | null;
  onSelectionChange?: (selection: ProductDetailSelection) => void;
}

const EMPTY_CUSTOMIZABLE_OPTIONS: MagentoCustomizableOption[] = [];
const EMPTY_CONFIGURABLE_OPTIONS: MagentoConfigurableOption[] = [];
const EMPTY_CHILDREN = [] as NonNullable<MagentoProduct['children']>;
const PURCHASE_BENEFITS = [
  {
    label: '1-Year Limited Warranty',
    href: 'https://www.joydeem.com/warrant',
    icon: ShieldCheck,
  },
  {
    label: 'Free Shipping',
    href: 'https://www.joydeem.com/shipping-policy',
    icon: Truck,
  },
  {
    label: '30-Day Risk-Free Returns',
    href: 'https://www.joydeem.com/return-policy',
    icon: Calendar,
  },
] as const;

function PurchaseBenefitsBar() {
  return (
    <div className="grid grid-cols-3 divide-x divide-border rounded-md bg-surface-muted">
      {PURCHASE_BENEFITS.map(item => {
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-20 flex-col items-center justify-center gap-2 px-2 py-3 text-center transition hover:bg-surface"
          >
            <Icon className="h-4 w-4 text-ink" />
            <span className="text-xs font-medium leading-5 text-ink">
              {item.label}
            </span>
          </a>
        );
      })}
    </div>
  );
}

function calculateCustomOptionPriceDelta(
  options: MagentoCustomizableOption[],
  selections: Record<string, string | string[]>,
  basePrice: number
): number {
  if (options.length === 0) return 0;

  const optionMap = new Map<number, MagentoCustomizableOption>(
    options.map(option => [option.option_id, option])
  );

  return Object.entries(selections).reduce((sum, [optionId, rawValue]) => {
    const option = optionMap.get(Number(optionId));
    if (
      !option ||
      !Array.isArray(option.values) ||
      option.values.length === 0
    ) {
      return sum;
    }

    const selectedIds = Array.isArray(rawValue) ? rawValue : [rawValue];
    const optionExtra = selectedIds.reduce((optionSum, selectedId) => {
      const value = option.values?.find(
        item => String(item.option_type_id) === String(selectedId)
      );
      if (!value) return optionSum;

      const price =
        value.price_type === 'percent'
          ? (basePrice * value.price) / 100
          : value.price;
      return optionSum + price;
    }, 0);

    return sum + optionExtra;
  }, 0);
}

function hasRequiredCustomOptionsSelected(
  options: MagentoCustomizableOption[],
  selections: Record<string, string | string[]>
): boolean {
  if (options.length === 0) return true;

  return options
    .filter(option => option.required)
    .every(option => {
      const selected = selections[String(option.option_id)];

      if (option.type === 'checkbox' || option.type === 'multiple') {
        return Array.isArray(selected) && selected.length > 0;
      }

      if (Array.isArray(selected)) {
        return selected.length > 0;
      }

      return typeof selected === 'string' && selected.trim().length > 0;
    });
}

// ─── 数量输入框 ───────────────────────────────────────────────────────────────
function QtyInput({
  value,
  min = 0,
  onChange,
}: {
  value: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  const commitDraftValue = useCallback(() => {
    const next = Number.parseInt(draftValue, 10);
    if (Number.isNaN(next)) {
      onChange(min);
      setDraftValue(String(min));
      return;
    }

    const clamped = Math.max(min, next);
    onChange(clamped);
    setDraftValue(String(clamped));
  }, [draftValue, min, onChange]);

  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-surface-muted"
      >
        −
      </button>

      <input
        type="number"
        min={min}
        step={1}
        inputMode="numeric"
        aria-label="Quantity"
        value={draftValue}
        onChange={e => setDraftValue(e.target.value)}
        onBlur={commitDraftValue}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            commitDraftValue();
            e.currentTarget.blur();
          }
        }}
        className="h-11 w-12 border-x border-border bg-surface text-center text-sm font-semibold text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        className="flex h-11 w-11 items-center justify-center text-ink transition hover:bg-surface-muted"
      >
        +
      </button>
    </div>
  );
}

const PRODUCT_MAIN_ANCHOR_ID = 'product-main';

function scrollToProductMain() {
  document.getElementById(PRODUCT_MAIN_ANCHOR_ID)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function useStickyAddToCartVisibility(anchorRef: {
  current: HTMLElement | null;
}) {
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      setShowStickyBar(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const hasScrolledPastAnchor = entry.boundingClientRect.top < 0;
        setShowStickyBar(!entry.isIntersecting && hasScrolledPastAnchor);
      },
      {
        threshold: 0,
      }
    );

    observer.observe(anchor);

    return () => {
      observer.disconnect();
    };
  }, [anchorRef]);

  return showStickyBar;
}

type StickyPrimaryAction =
  | {
      type: 'add-to-cart';
      sku: string;
      qty: number;
      productOptionsJson?: string;
      disabled: boolean;
      disabledLabel: string;
    }
  | {
      type: 'scroll-to-main';
      label: string;
    };

interface StickyAddToCartBarProps {
  visible: boolean;
  productName: string;
  thumbnailUrl?: string | null;
  priceText: string;
  onQtyChange?: (nextQty: number) => void;
  qty: number;
  primaryAction: StickyPrimaryAction;
  couponCode?: string | null;
}

function StickyAddToCartBar({
  visible,
  productName,
  thumbnailUrl,
  priceText,
  onQtyChange,
  qty,
  primaryAction,
  couponCode,
}: StickyAddToCartBarProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3.5 shadow-[0_-10px_28px_rgba(15,23,42,0.12)] backdrop-blur sm:pt-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-3">
            {thumbnailUrl ? (
              <OptimizedImage
                src={thumbnailUrl}
                alt={productName}
                width={44}
                height={44}
                maxDisplayWidth={44}
                className="h-11 w-11 shrink-0 rounded object-contain"
              />
            ) : (
              <div className="h-11 w-11 shrink-0 rounded bg-surface-muted" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {productName}
              </p>
              <p className="text-xs font-semibold text-ink-muted">
                {priceText}
              </p>
            </div>
          </div>
        </div>

        {onQtyChange && <QtyInput value={qty} min={1} onChange={onQtyChange} />}

        <div className="min-w-0 shrink-0 sm:w-[200px]">
          {primaryAction.type === 'scroll-to-main' ? (
            <button
              type="button"
              onClick={scrollToProductMain}
              aria-label="Scroll to main product area"
              className="btn-primary !rounded-xl border-0 flex h-11 w-full min-w-[140px] items-center justify-center gap-2 px-4 text-sm font-semibold"
            >
              <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
              {primaryAction.label}
            </button>
          ) : (
            <AddToCartButton
              sku={primaryAction.sku}
              qty={primaryAction.qty}
              productOptionsJson={primaryAction.productOptionsJson}
              disabled={primaryAction.disabled}
              disabledLabel={primaryAction.disabledLabel}
              couponCode={couponCode}
              className="btn-primary !rounded-xl border-0 flex h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Simple / Virtual ────────────────────────────────────────────────────────

function SimpleOptions({
  product,
  onSelectionChange,
  claimedCouponCode,
}: {
  product: MagentoProduct;
  onSelectionChange?: (selection: ProductDetailSelection) => void;
  claimedCouponCode?: string | null;
}) {
  const [qty, setQty] = useState(1);
  const purchaseActionsRef = useRef<HTMLDivElement | null>(null);
  const [customSelections, setCustomSelections] = useState<
    Record<string, string | string[]>
  >({});
  const showStickyBar = useStickyAddToCartVisibility(purchaseActionsRef);

  const customOptions = product.options ?? EMPTY_CUSTOMIZABLE_OPTIONS;
  const customOptionPriceDelta = useMemo(
    () =>
      calculateCustomOptionPriceDelta(
        customOptions,
        customSelections,
        product.price
      ),
    [customOptions, customSelections, product.price]
  );
  const allCustomRequiredSelected = useMemo(
    () => hasRequiredCustomOptionsSelected(customOptions, customSelections),
    [customOptions, customSelections]
  );

  useEffect(() => {
    onSelectionChange?.({
      selectedVariant: null,
      allSelected: allCustomRequiredSelected,
      customOptionPriceDelta,
    });
  }, [allCustomRequiredSelected, customOptionPriceDelta, onSelectionChange]);

  const productOptionsJson = useMemo(() => {
    const entries = Object.entries(customSelections).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : v !== ''
    );
    if (entries.length === 0) return undefined;

    const custom_options = entries.map(([optionId, value]) => ({
      option_id: optionId,
      option_value: Array.isArray(value) ? value.join(',') : value,
    }));
    return JSON.stringify({ custom_options });
  }, [customSelections]);

  const stickyPriceText = useMemo(() => {
    const basePrice =
      product.special_price != null && product.special_price < product.price
        ? product.special_price
        : product.price;
    return formatPrice(basePrice + customOptionPriceDelta, product.currency);
  }, [
    customOptionPriceDelta,
    product.currency,
    product.price,
    product.special_price,
  ]);

  return (
    <div className="space-y-6">
      {customOptions.length > 0 && (
        <CustomizableOptionsSection
          options={customOptions}
          selections={customSelections}
          onSelectionsChange={setCustomSelections}
          currency={product.currency}
        />
      )}
      <div ref={purchaseActionsRef} className="flex items-center gap-3">
        <QtyInput value={qty} min={1} onChange={setQty} />
        <div className="flex-1">
          <AddToCartButton
            sku={product.sku}
            qty={qty}
            productOptionsJson={productOptionsJson}
            couponCode={claimedCouponCode}
            disabled={!allCustomRequiredSelected}
            disabledLabel="Select required options"
            className="btn-primary !rounded-xl border-0 flex h-11 w-full items-center justify-center gap-2 px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            gtmProduct={{
              sku: product.sku,
              name: product.name,
              price: product.price,
              final_price: product.special_price ?? product.price,
              currency: product.currency,
              categories: product.categories?.map(c => c.name),
              brand: product.brand,
              url_key: product.url_key,
              image: product.thumbnail_url ?? product.image_url,
            }}
          />
        </div>
      </div>
      <PurchaseBenefitsBar />
      <StickyAddToCartBar
        couponCode={claimedCouponCode}
        visible={showStickyBar}
        productName={product.name}
        thumbnailUrl={product.thumbnail_url ?? product.image_url}
        priceText={stickyPriceText}
        qty={qty}
        onQtyChange={setQty}
        primaryAction={
          !allCustomRequiredSelected
            ? { type: 'scroll-to-main', label: 'Select required options' }
            : {
                type: 'add-to-cart',
                sku: product.sku,
                qty,
                productOptionsJson,
                disabled: false,
                disabledLabel: 'Select required options',
              }
        }
      />
    </div>
  );
}

// ─── Configurable ─────────────────────────────────────────────────────────────

function ConfigurableOptions({
  product,
  onSelectionChange,
  claimedCouponCode,
}: {
  product: MagentoProduct;
  onSelectionChange?: (selection: ProductDetailSelection) => void;
  claimedCouponCode?: string | null;
}) {
  const searchParams = useSearchParams();
  const purchaseActionsRef = useRef<HTMLDivElement | null>(null);

  const configurableOptions =
    product.configurable_options ??
    product.extension_attributes?.configurable_product_options ??
    EMPTY_CONFIGURABLE_OPTIONS;

  const children = product.children ?? EMPTY_CHILDREN;
  const variantSku = searchParams?.get('variant') ?? null;

  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, number>
  >({});
  const [qty, setQty] = useState(1);
  const showStickyBar = useStickyAddToCartVisibility(purchaseActionsRef);

  const findChildSku = useCallback(
    (attrs: Record<string, number>): string | null => {
      const child = children.find(item =>
        configurableOptions.every(option => {
          const selectedValue = attrs[option.attribute_id];
          if (selectedValue === undefined) {
            return false;
          }

          const childValueById = item.attributes[option.attribute_id];
          if (childValueById != null) {
            return childValueById === String(selectedValue);
          }

          if (!option.attribute_code) {
            return false;
          }

          const childValueByCode = item.attributes[option.attribute_code];
          if (childValueByCode != null) {
            if (childValueByCode === String(selectedValue)) {
              return true;
            }

            const selectedOption = option.values.find(
              value => value.value_index === selectedValue
            );
            return selectedOption?.label === childValueByCode;
          }

          return false;
        })
      );

      return child?.sku ?? null;
    },
    [children, configurableOptions]
  );

  const findAttributesBySku = useCallback(
    (childSku: string): Record<string, number> | null => {
      const child = children.find(item => item.sku === childSku);
      if (!child) {
        return null;
      }

      const attrs: Record<string, number> = {};

      for (const option of configurableOptions) {
        const childValueById = child.attributes[option.attribute_id];
        if (childValueById != null) {
          const selectedValue = Number(childValueById);
          const hasMatchingValue = option.values.some(
            value => value.value_index === selectedValue
          );

          if (!hasMatchingValue) {
            return null;
          }

          attrs[option.attribute_id] = selectedValue;
          continue;
        }

        if (!option.attribute_code) {
          return null;
        }

        const childValueByCode = child.attributes[option.attribute_code];
        if (!childValueByCode) {
          return null;
        }

        const selectedByValueIndex = option.values.find(
          value => String(value.value_index) === childValueByCode
        );
        if (selectedByValueIndex) {
          attrs[option.attribute_id] = selectedByValueIndex.value_index;
          continue;
        }

        const selectedByLabel = option.values.find(
          value => value.label === childValueByCode
        );
        if (!selectedByLabel) {
          return null;
        }

        attrs[option.attribute_id] = selectedByLabel.value_index;
      }

      return attrs;
    },
    [children, configurableOptions]
  );

  useEffect(() => {
    if (children.length === 0 || !variantSku) {
      return;
    }

    const attrs = findAttributesBySku(variantSku);
    if (!attrs) {
      return;
    }

    setSelectedAttributes(prev => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(attrs);
      const isSameSelection =
        prevKeys.length === nextKeys.length &&
        nextKeys.every(key => prev[key] === attrs[key]);

      return isSameSelection ? prev : attrs;
    });
  }, [children, configurableOptions, variantSku, findAttributesBySku]);

  const allSelected = configurableOptions.every(
    option => selectedAttributes[option.attribute_id] !== undefined
  );

  const selectedChild = useMemo(() => {
    if (!allSelected) {
      return null;
    }

    return (
      children.find(item => item.sku === findChildSku(selectedAttributes)) ??
      null
    );
  }, [allSelected, children, selectedAttributes, findChildSku]);

  const effectiveCouponCode = useMemo(() => {
    if (allSelected && selectedChild?.cp_code) return selectedChild.cp_code;
    return claimedCouponCode ?? null;
  }, [allSelected, selectedChild?.cp_code, claimedCouponCode]);

  useEffect(() => {
    if (!allSelected) {
      return;
    }

    const childSku = findChildSku(selectedAttributes);
    if (!childSku || childSku === variantSku) {
      return;
    }

    const nextParams = new URLSearchParams(window.location.search);
    nextParams.set('variant', childSku);
    const nextQuery = nextParams.toString();
    const nextUrl = `${window.location.pathname}${
      nextQuery ? `?${nextQuery}` : ''
    }${window.location.hash}`;

    window.history.replaceState(window.history.state, '', nextUrl);
  }, [allSelected, selectedAttributes, variantSku, findChildSku]);

  const customOptions = product.options ?? EMPTY_CUSTOMIZABLE_OPTIONS;
  const [customSelections, setCustomSelections] = useState<
    Record<string, string | string[]>
  >({});
  const basePrice = selectedChild?.price ?? product.price;
  const customOptionPriceDelta = useMemo(
    () =>
      calculateCustomOptionPriceDelta(
        customOptions,
        customSelections,
        basePrice
      ),
    [basePrice, customOptions, customSelections]
  );
  const allCustomRequiredSelected = useMemo(
    () => hasRequiredCustomOptionsSelected(customOptions, customSelections),
    [customOptions, customSelections]
  );

  const productOptionsJson = useMemo(() => {
    if (!allSelected) return undefined;

    const payload: Record<string, unknown> = {
      super_attribute: selectedAttributes,
    };

    const customEntries = Object.entries(customSelections).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : v !== ''
    );
    if (customEntries.length > 0) {
      payload.custom_options = customEntries.map(([optionId, value]) => ({
        option_id: optionId,
        option_value: Array.isArray(value) ? value.join(',') : value,
      }));
    }

    return JSON.stringify(payload);
  }, [allSelected, selectedAttributes, customSelections]);

  useEffect(() => {
    onSelectionChange?.({
      selectedVariant: selectedChild,
      allSelected,
      customOptionPriceDelta,
    });
  }, [
    allCustomRequiredSelected,
    allSelected,
    customOptionPriceDelta,
    onSelectionChange,
    selectedChild,
  ]);

  const stickyPriceText = useMemo(() => {
    const basePrice =
      selectedChild?.special_price != null &&
      selectedChild.special_price < selectedChild.price
        ? selectedChild.special_price
        : selectedChild?.price ?? product.special_price ?? product.price;
    return formatPrice(basePrice + customOptionPriceDelta, product.currency);
  }, [
    customOptionPriceDelta,
    product.currency,
    product.price,
    product.special_price,
    selectedChild,
  ]);

  return (
    <div className="space-y-6">
      {configurableOptions.map(option => (
        <div key={option.id}>
          <p className="mb-2 text-sm font-medium text-ink">{option.label}</p>
          <div className="flex flex-wrap gap-2">
            {option.values.map(val => {
              const isSelected =
                selectedAttributes[option.attribute_id] === val.value_index;
              return (
                <button
                  key={val.value_index}
                  type="button"
                  onClick={() =>
                    setSelectedAttributes(prev => ({
                      ...prev,
                      [option.attribute_id]: val.value_index,
                    }))
                  }
                  className={`rounded-lg border px-3.5 py-2 text-sm transition ${
                    isSelected
                      ? 'border-brand bg-brand/10 font-semibold text-brand'
                      : 'border-border text-ink hover:border-brand/40 hover:bg-surface'
                  }`}
                >
                  {val.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {customOptions.length > 0 && (
        <CustomizableOptionsSection
          options={customOptions}
          selections={customSelections}
          onSelectionsChange={setCustomSelections}
          currency={product.currency}
        />
      )}

      <div ref={purchaseActionsRef} className="flex items-center gap-3">
        <QtyInput value={qty} min={1} onChange={setQty} />

        <div className="flex-1">
          <AddToCartButton
            sku={product.sku}
            qty={qty}
            productOptionsJson={productOptionsJson}
            couponCode={effectiveCouponCode}
            disabled={!allSelected || !allCustomRequiredSelected}
            disabledLabel={
              !allSelected ? 'Select Options' : 'Select required options'
            }
            className="btn-primary !rounded-xl border-0 flex h-11 w-full items-center justify-center gap-2 px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            gtmProduct={{
              sku: selectedChild?.sku ?? product.sku,
              name: selectedChild?.name ?? product.name,
              price: selectedChild?.price ?? product.price,
              final_price:
                selectedChild?.special_price ??
                selectedChild?.price ??
                product.special_price ??
                product.price,
              currency: product.currency,
              categories: product.categories?.map(c => c.name),
              brand: product.brand,
              url_key: product.url_key,
              image: product.thumbnail_url ?? product.image_url,
            }}
          />
        </div>
      </div>
      <PurchaseBenefitsBar />
      <StickyAddToCartBar
        couponCode={effectiveCouponCode}
        visible={showStickyBar}
        productName={selectedChild?.name ?? product.name}
        thumbnailUrl={product.thumbnail_url ?? product.image_url}
        priceText={stickyPriceText}
        qty={qty}
        onQtyChange={setQty}
        primaryAction={
          !allSelected
            ? { type: 'scroll-to-main', label: 'Select Options' }
            : !allCustomRequiredSelected
            ? {
                type: 'scroll-to-main',
                label: 'Select required options',
              }
            : {
                type: 'add-to-cart',
                sku: product.sku,
                qty,
                productOptionsJson,
                disabled: false,
                disabledLabel: 'Select Options',
              }
        }
      />
    </div>
  );
}

// ─── Grouped ─────────────────────────────────────────────────────────────────

function GroupedOptions({ product }: { product: MagentoProduct }) {
  const items = product.grouped_items ?? [];
  const purchaseActionsRef = useRef<HTMLDivElement | null>(null);

  const [qtys, setQtys] = useState<Record<number, number>>(() =>
    Object.fromEntries(items.map(item => [item.id, item.default_qty ?? 1]))
  );
  const showStickyBar = useStickyAddToCartVisibility(purchaseActionsRef);

  const hasAny = Object.values(qtys).some(q => q > 0);

  const productOptionsJson = JSON.stringify({
    super_group: Object.fromEntries(
      Object.entries(qtys).map(([id, q]) => [id, q])
    ),
  });
  const stickyPriceText = formatPrice(
    product.special_price ?? product.price,
    product.currency
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {item.thumbnail_url && (
                <OptimizedImage
                  src={item.thumbnail_url}
                  alt={item.name}
                  width={48}
                  height={48}
                  maxDisplayWidth={48}
                  className="h-12 w-12 shrink-0 rounded-md object-contain"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {item.name}
                </p>
                <p className="text-xs text-ink-muted">
                  {formatPrice(item.price, product.currency)}
                  {!item.is_in_stock && (
                    <span className="ml-2 text-red-500">Out of stock</span>
                  )}
                </p>
              </div>
            </div>
            <QtyInput
              value={qtys[item.id] ?? 0}
              min={0}
              onChange={v => setQtys(prev => ({ ...prev, [item.id]: v }))}
            />
          </div>
        ))}
      </div>

      <div ref={purchaseActionsRef}>
        <AddToCartButton
          sku={product.sku}
          qty={1}
          productOptionsJson={productOptionsJson}
          disabled={!hasAny}
          disabledLabel="Select at least one item"
          gtmProduct={{
            sku: product.sku,
            name: product.name,
            price: product.price,
            final_price: product.special_price ?? product.price,
            currency: product.currency,
            categories: product.categories?.map(c => c.name),
            brand: product.brand,
            url_key: product.url_key,
            image: product.thumbnail_url ?? product.image_url,
          }}
        />
      </div>
      <PurchaseBenefitsBar />
      <StickyAddToCartBar
        visible={showStickyBar}
        productName={product.name}
        thumbnailUrl={product.thumbnail_url ?? product.image_url}
        priceText={stickyPriceText}
        qty={1}
        primaryAction={
          !hasAny
            ? { type: 'scroll-to-main', label: 'Select at least one item' }
            : {
                type: 'add-to-cart',
                sku: product.sku,
                qty: 1,
                productOptionsJson,
                disabled: false,
                disabledLabel: 'Select at least one item',
              }
        }
      />
    </div>
  );
}

// ─── Bundle ───────────────────────────────────────────────────────────────────

function BundleOptions({ product }: { product: MagentoProduct }) {
  const options = product.bundle_options ?? [];
  const purchaseActionsRef = useRef<HTMLDivElement | null>(null);

  // single-select options: Record<optionId, selectionId>
  const [singleSelections, setSingleSelections] = useState<
    Record<number, number | null>
  >(() =>
    Object.fromEntries(
      options
        .filter(o => o.type === 'select' || o.type === 'radio')
        .map(o => {
          const def = o.selections.find(s => s.is_default);
          return [o.option_id, def ? def.selection_id : null];
        })
    )
  );

  // multi-select options: Record<optionId, Set<selectionId>>
  const [multiSelections, setMultiSelections] = useState<
    Record<number, Set<number>>
  >(() =>
    Object.fromEntries(
      options
        .filter(o => o.type === 'checkbox' || o.type === 'multi')
        .map(o => {
          const defaults = o.selections
            .filter(s => s.is_default)
            .map(s => s.selection_id);
          return [o.option_id, new Set(defaults)];
        })
    )
  );

  // qty per option (when can_change_qty=true)
  const [optionQtys, setOptionQtys] = useState<Record<number, number>>(() =>
    Object.fromEntries(
      options.map(o => [
        o.option_id,
        o.selections.find(s => s.is_default)?.default_qty ?? 1,
      ])
    )
  );

  const [qty, setQty] = useState(1);
  const showStickyBar = useStickyAddToCartVisibility(purchaseActionsRef);

  // 校验所有 required 选项是否已选
  const allRequiredSelected = options
    .filter(o => o.required)
    .every(o => {
      if (o.type === 'select' || o.type === 'radio') {
        return singleSelections[o.option_id] != null;
      }
      return (multiSelections[o.option_id]?.size ?? 0) > 0;
    });

  // 构建 bundle_option / bundle_option_qty
  const buildOptionsJson = () => {
    const bundleOption: Record<number, string | string[]> = {};
    const bundleOptionQty: Record<number, number> = {};

    for (const opt of options) {
      if (opt.type === 'select' || opt.type === 'radio') {
        const sel = singleSelections[opt.option_id];
        if (sel != null) {
          bundleOption[opt.option_id] = String(sel);
          bundleOptionQty[opt.option_id] = optionQtys[opt.option_id] ?? 1;
        }
      } else {
        const sels = [...(multiSelections[opt.option_id] ?? [])];
        if (sels.length > 0) {
          bundleOption[opt.option_id] = sels.map(String);
          bundleOptionQty[opt.option_id] = optionQtys[opt.option_id] ?? 1;
        }
      }
    }

    return JSON.stringify({
      bundle_option: bundleOption,
      bundle_option_qty: bundleOptionQty,
    });
  };
  const stickyPriceText = formatPrice(
    product.special_price ?? product.price,
    product.currency
  );

  return (
    <div className="space-y-6">
      {options.map(opt => (
        <div key={opt.option_id}>
          <p className="mb-2 text-sm font-medium text-ink">
            {opt.title}
            {opt.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </p>

          {(opt.type === 'select' || opt.type === 'radio') && (
            <div className="flex flex-wrap gap-2">
              {opt.selections.map(sel => {
                const isSelected =
                  singleSelections[opt.option_id] === sel.selection_id;
                return (
                  <button
                    key={sel.selection_id}
                    type="button"
                    disabled={!sel.is_in_stock}
                    onClick={() =>
                      setSingleSelections(prev => ({
                        ...prev,
                        [opt.option_id]: sel.selection_id,
                      }))
                    }
                    className={`rounded-lg border px-3.5 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      isSelected
                        ? 'border-brand bg-brand/10 font-semibold text-brand'
                        : 'border-border text-ink hover:border-brand/40 hover:bg-surface'
                    }`}
                  >
                    {sel.name}
                    {sel.price > 0 && (
                      <span className="ml-1 text-xs text-ink-muted">
                        +{formatPrice(sel.price, product.currency)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {(opt.type === 'checkbox' || opt.type === 'multi') && (
            <div className="space-y-2">
              {opt.selections.map(sel => {
                const isChecked =
                  multiSelections[opt.option_id]?.has(sel.selection_id) ??
                  false;
                return (
                  <label
                    key={sel.selection_id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      isChecked
                        ? 'border-brand bg-brand/5'
                        : 'border-border hover:bg-surface'
                    } ${
                      !sel.is_in_stock ? 'cursor-not-allowed opacity-40' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!sel.is_in_stock}
                      onChange={e => {
                        setMultiSelections(prev => {
                          const next = new Set(prev[opt.option_id] ?? []);
                          if (e.target.checked) {
                            next.add(sel.selection_id);
                          } else {
                            next.delete(sel.selection_id);
                          }
                          return { ...prev, [opt.option_id]: next };
                        });
                      }}
                      className="accent-brand"
                    />
                    <span className="flex-1 text-sm text-ink">{sel.name}</span>
                    {sel.price > 0 && (
                      <span className="text-xs text-ink-muted">
                        +{formatPrice(sel.price, product.currency)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {/* 可变数量输入 */}
          {opt.selections.some(s => s.can_change_qty) && (
            <div className="mt-3">
              <p className="mb-1 text-xs text-ink-muted">Quantity</p>
              <QtyInput
                value={optionQtys[opt.option_id] ?? 1}
                min={1}
                onChange={v =>
                  setOptionQtys(prev => ({ ...prev, [opt.option_id]: v }))
                }
              />
            </div>
          )}
        </div>
      ))}

      <div ref={purchaseActionsRef} className="flex items-center gap-3">
        <QtyInput value={qty} min={1} onChange={setQty} />
        <div className="flex-1">
          <AddToCartButton
            sku={product.sku}
            qty={qty}
            productOptionsJson={buildOptionsJson()}
            disabled={!allRequiredSelected}
            disabledLabel="Select required options"
            className="btn-primary !rounded-xl border-0 flex h-11 w-full items-center justify-center gap-2 px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            gtmProduct={{
              sku: product.sku,
              name: product.name,
              price: product.price,
              final_price: product.special_price ?? product.price,
              currency: product.currency,
              categories: product.categories?.map(c => c.name),
              brand: product.brand,
              url_key: product.url_key,
              image: product.thumbnail_url ?? product.image_url,
            }}
          />
        </div>
      </div>
      <PurchaseBenefitsBar />
      <StickyAddToCartBar
        visible={showStickyBar}
        productName={product.name}
        thumbnailUrl={product.thumbnail_url ?? product.image_url}
        priceText={stickyPriceText}
        qty={qty}
        onQtyChange={setQty}
        primaryAction={
          !allRequiredSelected
            ? { type: 'scroll-to-main', label: 'Select required options' }
            : {
                type: 'add-to-cart',
                sku: product.sku,
                qty,
                productOptionsJson: buildOptionsJson(),
                disabled: false,
                disabledLabel: 'Select required options',
              }
        }
      />
    </div>
  );
}

// ─── Downloadable ─────────────────────────────────────────────────────────────

function DownloadableOptions({ product }: { product: MagentoProduct }) {
  const links = product.downloadable_links ?? [];
  const samples = product.downloadable_samples ?? [];
  const purchaseSeparately = product.links_purchased_separately ?? false;
  const purchaseActionsRef = useRef<HTMLDivElement | null>(null);

  const [selectedLinks, setSelectedLinks] = useState<Set<number>>(
    () => new Set(links.map(l => l.link_id))
  );
  const [qty, setQty] = useState(1);
  const showStickyBar = useStickyAddToCartVisibility(purchaseActionsRef);

  const toggleLink = (id: number) => {
    setSelectedLinks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const canAddToCart = !purchaseSeparately || selectedLinks.size > 0;

  const productOptionsJson = purchaseSeparately
    ? JSON.stringify({ links: [...selectedLinks] })
    : undefined;
  const stickyPriceText = formatPrice(
    product.special_price ?? product.price,
    product.currency
  );

  return (
    <div className="space-y-6">
      {/* 免费样本 */}
      {samples.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Samples</p>
          <div className="flex flex-wrap gap-2">
            {samples.map(s => (
              <a
                key={s.sample_id}
                href={s.sample_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-brand transition hover:bg-surface"
              >
                Preview: {s.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 可下载链接选择 */}
      {purchaseSeparately && links.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">
            Select download links
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          </p>
          <div className="space-y-2">
            {links.map(link => {
              const isChecked = selectedLinks.has(link.link_id);
              return (
                <label
                  key={link.link_id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                    isChecked
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:bg-surface'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleLink(link.link_id)}
                    className="accent-brand"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{link.title}</p>
                    {(link.number_of_downloads ?? 0) > 0 && (
                      <p className="text-xs text-ink-muted">
                        {link.number_of_downloads} downloads
                      </p>
                    )}
                    {(link.number_of_downloads ?? 0) === 0 && (
                      <p className="text-xs text-ink-muted">
                        Unlimited downloads
                      </p>
                    )}
                  </div>
                  {link.price > 0 && (
                    <span className="shrink-0 text-sm font-semibold text-ink">
                      {formatPrice(link.price, product.currency)}
                    </span>
                  )}
                  {link.sample_url && (
                    <a
                      href={link.sample_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-xs text-brand hover:underline"
                    >
                      Preview
                    </a>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div ref={purchaseActionsRef} className="flex items-center gap-3">
        <QtyInput value={qty} min={1} onChange={setQty} />
        <div className="flex-1">
          <AddToCartButton
            sku={product.sku}
            qty={qty}
            productOptionsJson={productOptionsJson}
            disabled={!canAddToCart}
            disabledLabel="Select at least one link"
            className="btn-primary !rounded-xl border-0 flex h-11 w-full items-center justify-center gap-2 px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            gtmProduct={{
              sku: product.sku,
              name: product.name,
              price: product.price,
              final_price: product.special_price ?? product.price,
              currency: product.currency,
              categories: product.categories?.map(c => c.name),
              brand: product.brand,
              url_key: product.url_key,
              image: product.thumbnail_url ?? product.image_url,
            }}
          />
        </div>
      </div>
      <PurchaseBenefitsBar />
      <StickyAddToCartBar
        visible={showStickyBar}
        productName={product.name}
        thumbnailUrl={product.thumbnail_url ?? product.image_url}
        priceText={stickyPriceText}
        qty={qty}
        onQtyChange={setQty}
        primaryAction={
          !canAddToCart
            ? { type: 'scroll-to-main', label: 'Select at least one link' }
            : {
                type: 'add-to-cart',
                sku: product.sku,
                qty,
                productOptionsJson,
                disabled: false,
                disabledLabel: 'Select at least one link',
              }
        }
      />
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function ProductDetailClient({
  product,
  claimedCouponCode,
  onSelectionChange,
}: ProductDetailClientProps) {
  switch (product.type_id) {
    case 'configurable':
      return (
        <ConfigurableOptions
          product={product}
          claimedCouponCode={claimedCouponCode}
          onSelectionChange={onSelectionChange}
        />
      );
    case 'grouped':
      return <GroupedOptions product={product} />;
    case 'bundle':
      return <BundleOptions product={product} />;
    case 'downloadable':
      return <DownloadableOptions product={product} />;
    default:
      // simple / virtual
      return (
        <SimpleOptions
          product={product}
          claimedCouponCode={claimedCouponCode}
          onSelectionChange={onSelectionChange}
        />
      );
  }
}
