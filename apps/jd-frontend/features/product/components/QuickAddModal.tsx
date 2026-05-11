'use client';

import { OptimizedImage } from '@prism/ui';
import { X, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatPrice } from '@prism/shared';
import type { ProductCardItem } from '../bff-types';
import { useAddToCartAction } from '@/features/cart';
import {
  CustomizableOptionsSection,
  calculateCustomOptionPriceDelta,
  hasRequiredCustomOptionsSelected,
} from './CustomizableOptionsSection';

interface VariantData {
  options: Array<{
    attribute_id: number;
    code: string;
    label: string;
    values: Array<{ label: string; value: string }>;
  }>;
  customizable_options: Array<{
    option_id: number;
    title: string;
    required: boolean;
    type: string;
    values?: Array<{ option_type_id: number; title: string; price: number }>;
  }>;
  variants: Array<{
    sku: string;
    attributes: Record<string, string>;
    inStock: boolean;
    price: number;
  }>;
}

interface QuickAddModalProps {
  product: ProductCardItem;
  variantData: VariantData;
  error?: string | null;
  onClose: () => void;
  onAdded?: () => void;
}

export function QuickAddModal({
  product,
  variantData,
  error,
  onClose,
  onAdded,
}: QuickAddModalProps) {
  const { addItemToCart, isAdding, error: addError } = useAddToCartAction();
  const priceValue = product.price.value;
  const currencyCode = product.price.currency;
  const originalPrice = product.originalPrice;
  const hasDiscount =
    priceValue != null && originalPrice != null && originalPrice > priceValue;
  const imageUrl = product.image;

  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [customSelections, setCustomSelections] = useState<
    Record<string, string | string[]>
  >({});

  const isLoading =
    variantData.options.length === 0 && variantData.variants.length === 0;

  const allConfigOptionsSelected = useMemo(() => {
    return variantData.options.every(option =>
      Boolean(selectedAttributes[String(option.attribute_id)])
    );
  }, [selectedAttributes, variantData.options]);

  const selectedVariant = useMemo(() => {
    if (!allConfigOptionsSelected) return null;
    return (
      variantData.variants.find(variant =>
        variantData.options.every(
          option =>
            variant.attributes[String(option.attribute_id)] ===
            selectedAttributes[String(option.attribute_id)]
        )
      ) ?? null
    );
  }, [allConfigOptionsSelected, selectedAttributes, variantData]);

  const customOptionPriceDelta = useMemo(() => {
    return calculateCustomOptionPriceDelta(
      variantData.customizable_options.map(opt => ({
        option_id: opt.option_id,
        title: opt.title,
        required: opt.required,
        type: opt.type as
          | 'drop_down'
          | 'radio'
          | 'checkbox'
          | 'multiple'
          | 'field'
          | 'area',
        sort_order: 0,
        values: opt.values?.map(v => ({
          option_type_id: v.option_type_id,
          title: v.title,
          price: v.price,
          price_type: 'fixed' as const,
          sort_order: 0,
        })),
        max_characters: undefined,
      })),
      customSelections,
      selectedVariant?.price ?? priceValue ?? 0
    );
  }, [
    customSelections,
    selectedVariant,
    variantData.customizable_options,
    priceValue,
  ]);

  const allRequiredCustomSelected = useMemo(() => {
    return hasRequiredCustomOptionsSelected(
      variantData.customizable_options.map(opt => ({
        option_id: opt.option_id,
        title: opt.title,
        required: opt.required,
        type: opt.type as
          | 'drop_down'
          | 'radio'
          | 'checkbox'
          | 'multiple'
          | 'field'
          | 'area',
        sort_order: 0,
        values: opt.values?.map(v => ({
          option_type_id: v.option_type_id,
          title: v.title,
          price: v.price,
          price_type: 'fixed' as const,
          sort_order: 0,
        })),
        max_characters: undefined,
      })),
      customSelections
    );
  }, [customSelections, variantData.customizable_options]);

  const canAdd = selectedVariant != null && allRequiredCustomSelected;

  const displayPrice = useMemo(() => {
    const base = selectedVariant?.price ?? priceValue ?? originalPrice ?? 0;
    return base + customOptionPriceDelta;
  }, [selectedVariant, priceValue, originalPrice, customOptionPriceDelta]);

  const handleAdd = async () => {
    if (!canAdd) return;

    const payload: Record<string, unknown> = {
      super_attribute: selectedAttributes,
    };

    const customEntries = Object.entries(customSelections).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v !== ''
    );
    if (customEntries.length > 0) {
      payload.custom_options = customEntries.map(([optionId, value]) => ({
        option_id: optionId,
        option_value: Array.isArray(value) ? value.join(',') : value,
      }));
    }

    const added = await addItemToCart(
      {
        sku: product.sku,
        qty: 1,
        productOptionsJson: JSON.stringify(payload),
      },
      {
        openCartOnSuccess: true,
        onSuccess: onAdded,
      }
    );

    if (added) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-background p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-ink">Quick Buy</h3>
            <p className="mt-1 text-sm text-ink-muted">{product.displayName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick buy dialog"
            className="rounded-md p-1 text-ink-muted transition hover:bg-surface hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface">
              {imageUrl ? (
                <OptimizedImage
                  src={imageUrl}
                  alt={product.displayName}
                  fill
                  maxDisplayWidth={180}
                  className="object-contain p-3"
                  sizes="180px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-muted/30">
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-4">
              <div>
                <p className="line-clamp-2 text-sm text-ink-muted">
                  {product.displayName}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink">
                    {formatPrice(displayPrice, currencyCode)}
                  </span>
                  {selectedVariant == null &&
                    hasDiscount &&
                    originalPrice != null && (
                      <span className="text-sm text-ink-muted line-through">
                        {formatPrice(originalPrice, currencyCode)}
                      </span>
                    )}
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-20 animate-pulse rounded bg-surface-muted" />
                    <div className="h-10 w-full animate-pulse rounded-xl bg-surface-muted" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-surface-muted" />
                    <div className="h-10 w-full animate-pulse rounded-xl bg-surface-muted" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Configurable options */}
                  {variantData.options.map(option => (
                    <div key={String(option.attribute_id)}>
                      <p className="mb-2 text-sm font-medium text-ink">
                        {option.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map(value => {
                          const selected =
                            selectedAttributes[String(option.attribute_id)] ===
                            value.value;
                          return (
                            <button
                              key={value.value}
                              type="button"
                              onClick={() =>
                                setSelectedAttributes(prev => ({
                                  ...prev,
                                  [String(option.attribute_id)]: value.value,
                                }))
                              }
                              className={`rounded-lg border px-3.5 py-2 text-sm transition ${
                                selected
                                  ? 'border-brand bg-brand/10 font-semibold text-brand'
                                  : 'border-border text-ink hover:border-brand/40 hover:bg-surface'
                              }`}
                            >
                              {value.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Customizable options */}
                  <CustomizableOptionsSection
                    options={variantData.customizable_options.map(opt => ({
                      option_id: opt.option_id,
                      title: opt.title,
                      required: opt.required,
                      type: opt.type as
                        | 'drop_down'
                        | 'radio'
                        | 'checkbox'
                        | 'multiple'
                        | 'field'
                        | 'area',
                      sort_order: 0,
                      values: opt.values?.map(v => ({
                        option_type_id: v.option_type_id,
                        title: v.title,
                        price: v.price,
                        price_type: 'fixed' as const,
                        sort_order: 0,
                      })),
                      max_characters: undefined,
                    }))}
                    selections={customSelections}
                    onSelectionsChange={setCustomSelections}
                    currency={currencyCode}
                  />
                </>
              )}
            </div>
          </div>

          {!isLoading && allConfigOptionsSelected && !selectedVariant && (
            <p className="text-sm text-red-500">
              This combination is unavailable.
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {addError && <p className="text-sm text-red-500">{addError}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!canAdd || isAdding || isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
