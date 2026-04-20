'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface AvailableFilter {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterPanelProps {
  availableFilters: AvailableFilter[];
  appliedBrand?: string;
  appliedSize?: string;
  appliedCategory?: string;
  appliedStockStatus?: string;
  appliedPriceMin?: number;
  appliedPriceMax?: number;
  onChange?: () => void;
}

export function FilterPanel({
  availableFilters,
  appliedBrand,
  appliedSize,
  appliedCategory,
  appliedStockStatus,
  appliedPriceMin,
  appliedPriceMax,
  onChange,
}: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [priceMinInput, setPriceMinInput] = useState<string>(
    appliedPriceMin != null ? String(appliedPriceMin) : ''
  );
  const [priceMaxInput, setPriceMaxInput] = useState<string>(
    appliedPriceMax != null ? String(appliedPriceMax) : ''
  );

  useEffect(() => {
    setPriceMinInput(appliedPriceMin != null ? String(appliedPriceMin) : '');
    setPriceMaxInput(appliedPriceMax != null ? String(appliedPriceMax) : '');
  }, [appliedPriceMin, appliedPriceMax]);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      // 筛选项变化时重置到第一页
      params.delete('page');
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
      onChange?.();
    },
    [router, pathname, searchParams, onChange]
  );

  const commitPrice = useCallback(
    (min: string, max: string) => {
      const minNum = min.trim() === '' ? undefined : Number(min.trim());
      const maxNum = max.trim() === '' ? undefined : Number(max.trim());
      updateParams({
        price_min:
          minNum !== undefined && !Number.isNaN(minNum) && minNum >= 0
            ? String(minNum)
            : undefined,
        price_max:
          maxNum !== undefined && !Number.isNaN(maxNum) && maxNum >= 0
            ? String(maxNum)
            : undefined,
      });
    },
    [updateParams]
  );

  const hasFilters = availableFilters.length > 0;

  const hasApplied =
    appliedBrand !== undefined ||
    appliedSize !== undefined ||
    appliedCategory !== undefined ||
    appliedStockStatus !== undefined ||
    appliedPriceMin !== undefined ||
    appliedPriceMax !== undefined;

  if (!hasFilters && !hasApplied) return null;

  const brandFilter = availableFilters.find(f => f.key === 'brand');
  const sizeFilter = availableFilters.find(f => f.key === 'size');
  const categoryFilter = availableFilters.find(f => f.key === 'category');
  const stockStatusFilter = availableFilters.find(f => f.key === 'stock_status');

  return (
    <div className="space-y-6">
      {brandFilter && brandFilter.options.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink">Brand</h3>
          <div className="space-y-2">
            {brandFilter.options.map(option => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={appliedBrand === option.value}
                  onChange={e => {
                    updateParams({
                      brand: e.target.checked ? option.value : undefined,
                    });
                  }}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-sm text-ink">
                  {option.label}
                  {option.count !== undefined && (
                    <span className="ml-1 text-ink-muted">
                      ({option.count})
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {sizeFilter && sizeFilter.options.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink">Size</h3>
          <div className="space-y-2">
            {sizeFilter.options.map(option => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={appliedSize === option.value}
                  onChange={e => {
                    updateParams({
                      size: e.target.checked ? option.value : undefined,
                    });
                  }}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-sm text-ink">
                  {option.label}
                  {option.count !== undefined && (
                    <span className="ml-1 text-ink-muted">
                      ({option.count})
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {categoryFilter && categoryFilter.options.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink">Category</h3>
          <div className="space-y-2">
            {categoryFilter.options.map(option => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={appliedCategory === option.value}
                  onChange={e => {
                    updateParams({
                      category: e.target.checked ? option.value : undefined,
                    });
                  }}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-sm text-ink">
                  {option.label}
                  {option.count !== undefined && (
                    <span className="ml-1 text-ink-muted">
                      ({option.count})
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {stockStatusFilter && stockStatusFilter.options.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink">Availability</h3>
          <div className="space-y-2">
            {stockStatusFilter.options.map(option => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={appliedStockStatus === option.value}
                  onChange={e => {
                    updateParams({
                      stock_status: e.target.checked ? option.value : undefined,
                    });
                  }}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-sm text-ink">
                  {option.label === 'in_stock' ? 'In Stock' : option.label === 'out_of_stock' ? 'Out of Stock' : option.label}
                  {option.count !== undefined && (
                    <span className="ml-1 text-ink-muted">
                      ({option.count})
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={priceMinInput}
            onChange={e => setPriceMinInput(e.target.value)}
            onBlur={() => commitPrice(priceMinInput, priceMaxInput)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                commitPrice(priceMinInput, priceMaxInput);
              }
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <span className="text-ink-muted">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={priceMaxInput}
            onChange={e => setPriceMaxInput(e.target.value)}
            onBlur={() => commitPrice(priceMinInput, priceMaxInput)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                commitPrice(priceMinInput, priceMaxInput);
              }
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {hasApplied && (
        <button
          type="button"
          onClick={() =>
            updateParams({
              brand: undefined,
              size: undefined,
              category: undefined,
              stock_status: undefined,
              price_min: undefined,
              price_max: undefined,
            })
          }
          className="text-xs text-ink-muted underline hover:text-ink"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
