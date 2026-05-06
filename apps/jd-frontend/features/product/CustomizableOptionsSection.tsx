'use client';

import type { MagentoCustomizableOption } from '@/features/product/bff-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@prism/ui';
import { formatPrice } from '@/shared/utils/format-price';

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
  if (options.length === 0) return null;

  const sorted = [...options].sort((a, b) => a.sort_order - b.sort_order);

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

                    return (
                      <label
                        key={v.option_type_id}
                        className={`flex min-h-touch w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                          isChecked
                            ? 'border-brand bg-brand/5'
                            : 'border-border bg-surface hover:border-brand/40 hover:bg-surface-muted'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`custom-opt-${key}`}
                          value={String(v.option_type_id)}
                          checked={isChecked}
                          onChange={e =>
                            handleChange(opt.option_id, e.target.value)
                          }
                          className="sr-only"
                        />
                        <span
                          className={`relative h-4 w-4 shrink-0 rounded-full border transition ${
                            isChecked ? 'border-brand' : 'border-border'
                          }`}
                          aria-hidden="true"
                        >
                          <span
                            className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand transition ${
                              isChecked
                                ? 'scale-100 opacity-100'
                                : 'scale-0 opacity-0'
                            }`}
                          />
                        </span>
                        <span className="text-base text-ink">
                          {v.title}
                          {v.price > 0 && (
                            <span className="text-ink-muted">
                              {` (+${formatPrice(v.price, currency)})`}
                            </span>
                          )}
                        </span>
                      </label>
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

                    return (
                      <label
                        key={v.option_type_id}
                        className={`flex min-h-touch w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                          checked
                            ? 'border-brand bg-brand/5'
                            : 'border-border bg-surface hover:border-brand/40 hover:bg-surface-muted'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={val}
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? selected.filter(s => s !== val)
                              : [...selected, val];
                            handleChange(opt.option_id, next);
                          }}
                          className="sr-only"
                        />
                        <span
                          className={`relative h-4 w-4 shrink-0 rounded border transition ${
                            checked ? 'border-brand bg-brand' : 'border-border'
                          }`}
                          aria-hidden="true"
                        >
                          <span
                            className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-brand-foreground transition ${
                              checked
                                ? 'scale-100 opacity-100'
                                : 'scale-0 opacity-0'
                            }`}
                          />
                        </span>
                        <span className="text-base text-ink">
                          {v.title}
                          {v.price > 0 && (
                            <span className="text-ink-muted">
                              {` (+${formatPrice(v.price, currency)})`}
                            </span>
                          )}
                        </span>
                      </label>
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
