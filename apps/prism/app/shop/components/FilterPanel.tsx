'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { DiscoveryAvailableFilter } from '../../../lib/api/discovery/types';

interface FilterPanelProps {
  availableFilters: DiscoveryAvailableFilter[];
  appliedBrand?: string;
  appliedPriceMin?: number;
  appliedPriceMax?: number;
}

export function FilterPanel({
  availableFilters,
  appliedBrand,
  appliedPriceMin,
  appliedPriceMax,
}: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    },
    [router, pathname, searchParams]
  );

  const brandFilter = availableFilters.find(f => f.key === 'brand');
  const priceFilter = availableFilters.find(f => f.key === 'price');

  if (!brandFilter && !priceFilter) return null;

  return (
    <div className="space-y-6">
      {brandFilter && brandFilter.options && brandFilter.options.length > 0 && (
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

      {priceFilter && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink">Price</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={appliedPriceMin ?? ''}
              onChange={e =>
                updateParams({ price_min: e.target.value || undefined })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <span className="text-ink-muted">–</span>
            <input
              type="number"
              placeholder="Max"
              value={appliedPriceMax ?? ''}
              onChange={e =>
                updateParams({ price_max: e.target.value || undefined })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      )}

      {(appliedBrand ?? appliedPriceMin ?? appliedPriceMax) !== undefined && (
        <button
          type="button"
          onClick={() =>
            updateParams({
              brand: undefined,
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
