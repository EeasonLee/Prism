'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import type { MagentoCustomizableOption, ProductCardItem } from '../bff-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@prism/ui';
import { formatPrice } from '@prism/shared';
import { useAddonProducts } from '../hooks/use-addon-products';

export function calculateCustomOptionPriceDelta(
  options: MagentoCustomizableOption[],
  selections: Record<string, string | string[]>,
  _basePrice: number
): number {
  return Object.entries(selections).reduce((sum, [optionId, value]) => {
    const option = options.find(o => String(o.option_id) === optionId);
    if (!option || !option.values) return sum;

    const selectedValues = Array.isArray(value) ? value : [value];
    return selectedValues.reduce((innerSum, val) => {
      const found = option.values?.find(v => String(v.option_type_id) === val);
      return innerSum + (found?.price ?? 0);
    }, sum);
  }, 0);
}

export function hasRequiredCustomOptionsSelected(
  options: MagentoCustomizableOption[],
  selections: Record<string, string | string[]>
): boolean {
  return options.every(opt => {
    if (!opt.required) return true;
    const value = selections[opt.option_id];
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === 'string' && value.trim().length > 0;
  });
}

/** 检查 options 中是否有任何 value 带 SKU */
function hasAnySku(options: MagentoCustomizableOption[]): boolean {
  return options.some(opt =>
    opt.values?.some(v => v.sku != null && v.sku !== '')
  );
}

interface CustomizableOptionsSectionProps {
  options: MagentoCustomizableOption[];
  selections: Record<string, string | string[]>;
  onSelectionsChange: (s: Record<string, string | string[]>) => void;
  currency: string | null | undefined;
}

export function CustomizableOptionsSection({
  options,
  selections,
  onSelectionsChange,
  currency,
}: CustomizableOptionsSectionProps) {
  const sorted = useMemo(
    () => [...options].sort((a, b) => a.sort_order - b.sort_order),
    [options]
  );

  // 只有存在 SKU 时才调用 hook 获取商品数据
  const shouldFetchProducts = useMemo(() => hasAnySku(options), [options]);
  const addonProducts = useAddonProducts(
    shouldFetchProducts ? options : []
  );

  if (options.length === 0) return null;

  const handleChange = (optionId: number, value: string | string[]) => {
    onSelectionsChange({ ...selections, [String(optionId)]: value });
  };

  return (
    <div className="space-y-5">
      {sorted.map(opt => {
        const key = String(opt.option_id);
        const type = opt.type;

        if (
          type === 'drop_down' ||
          type === 'radio' ||
          type === 'checkbox' ||
          type === 'multiple'
        ) {
          const values = opt.values ?? [];
          const isMulti = type === 'checkbox' || type === 'multiple';

          // dropdown 保持原样
          if (type === 'drop_down') {
            return (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-semibold text-ink">
                  {opt.title}
                  {opt.required && <span className="text-red-500"> *</span>}
                </label>
                <Select
                  value={(selections[key] as string) ?? ''}
                  onValueChange={value => handleChange(opt.option_id, value)}
                >
                  <SelectTrigger className="min-h-touch w-full rounded-xl border-border/70 bg-surface px-4 py-2.5 text-sm text-ink focus:border-brand focus:ring-brand/25 data-[placeholder]:text-ink-muted">
                    <SelectValue placeholder="-- Select --" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/70 bg-surface p-1 shadow-lg">
                    {values.map(v => (
                      <SelectItem
                        key={v.option_type_id}
                        value={String(v.option_type_id)}
                        className="min-h-touch cursor-pointer rounded-lg text-sm text-ink focus:bg-surface-muted focus:text-ink"
                      >
                        {v.title}
                        {v.price > 0 && (
                          <span className="text-ink-muted">
                            {` (+${formatPrice(v.price, currency)})`}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          // radio 和 checkbox/multiple 使用商品卡片样式
          if (type === 'radio') {
            return (
              <fieldset key={key} className="space-y-2">
                <legend className="text-sm font-semibold text-ink">
                  {opt.title}
                  {opt.required && <span className="text-red-500"> *</span>}
                </legend>
                <div className="space-y-2">
                  {values.map(v => {
                    const isChecked =
                      (selections[key] as string) === String(v.option_type_id);
                    const product = addonProducts.get(v.option_type_id);

                    return (
                      <AddonProductCard
                        key={v.option_type_id}
                        title={v.title}
                        price={v.price}
                        currency={currency}
                        product={product}
                        checked={isChecked}
                        onChange={() =>
                          handleChange(opt.option_id, String(v.option_type_id))
                        }
                        inputType="radio"
                        name={`custom-opt-${key}`}
                      />
                    );
                  })}
                </div>
              </fieldset>
            );
          }

          if (isMulti) {
            const selected = (selections[key] as string[]) ?? [];
            return (
              <fieldset key={key} className="space-y-2">
                <legend className="text-sm font-semibold text-ink">
                  {opt.title}
                  {opt.required && <span className="text-red-500"> *</span>}
                </legend>
                <div className="space-y-2">
                  {values.map(v => {
                    const val = String(v.option_type_id);
                    const checked = selected.includes(val);
                    const product = addonProducts.get(v.option_type_id);

                    return (
                      <AddonProductCard
                        key={v.option_type_id}
                        title={v.title}
                        price={v.price}
                        currency={currency}
                        product={product}
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? selected.filter(s => s !== val)
                            : [...selected, val];
                          handleChange(opt.option_id, next);
                        }}
                        inputType="checkbox"
                      />
                    );
                  })}
                </div>
              </fieldset>
            );
          }
        }

        if (type === 'field' || type === 'area') {
          const Tag = type === 'area' ? 'textarea' : 'input';
          return (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-semibold text-ink">
                {opt.title}
                {opt.required && <span className="text-red-500"> *</span>}
              </label>
              <Tag
                className="min-h-touch w-full rounded-xl border border-border/70 bg-surface px-4 py-2.5 text-sm text-ink shadow-none transition hover:border-brand/40 focus:border-brand focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-brand/20"
                value={(selections[key] as string) ?? ''}
                onChange={e => handleChange(opt.option_id, e.target.value)}
                maxLength={
                  opt.max_characters != null && opt.max_characters > 0
                    ? opt.max_characters
                    : undefined
                }
                {...(type === 'area' ? { rows: 4 } : {})}
              />
              {opt.max_characters != null && opt.max_characters > 0 && (
                <p className="micro-text text-ink-muted">
                  Max {opt.max_characters} characters
                </p>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// ─── 内部组件 ─────────────────────────────────────────────────────────────────

interface AddonProductCardProps {
  title: string;
  price: number;
  currency: string | null | undefined;
  product?: ProductCardItem;
  checked: boolean;
  onChange: () => void;
  inputType: 'radio' | 'checkbox';
  name?: string;
}

/** 加购选项卡片（水平布局：左图右文） */
function AddonProductCard({
  title,
  price,
  currency,
  product,
  checked,
  onChange,
  inputType,
  name,
}: AddonProductCardProps) {
  const image = product?.image ?? null;
  const displayTitle = product?.shortName || product?.name || title;
  const displayPrice = product?.price.value ?? price;

  return (
    <label
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
        checked
          ? 'border-brand bg-brand/5'
          : 'border-border bg-surface hover:border-brand/40 hover:bg-surface-muted'
      }`}
    >
      <input
        type={inputType}
        name={name}
        value={String(product?.sku ?? '')}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />

      {/* 选择指示器 */}
      <span
        className={`relative h-4 w-4 shrink-0 transition ${
          inputType === 'radio' ? 'rounded-full' : 'rounded'
        } border ${checked ? 'border-brand' : 'border-border'}`}
        aria-hidden="true"
      >
        <span
          className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 transition ${
            inputType === 'radio' ? 'rounded-full' : 'rounded-sm'
          } ${checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} ${
            checked ? 'bg-brand' : 'bg-brand-foreground'
          }`}
        />
      </span>

      {/* 商品图片 */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
        {image ? (
          <Image
            src={image}
            alt={displayTitle}
            fill
            sizes="64px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 文字内容 */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm text-ink">{displayTitle}</p>
        {displayPrice > 0 && (
          <p className="mt-0.5 text-sm font-semibold text-brand">
            +{formatPrice(displayPrice, currency)}
          </p>
        )}
      </div>
    </label>
  );
}
