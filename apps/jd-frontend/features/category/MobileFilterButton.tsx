'use client';

import { useState } from 'react';
import { Sheet } from '@prism/ui';
import { SlidersHorizontal } from 'lucide-react';
import {
  FilterPanel,
  type AvailableFilter,
} from '@/features/search/FilterPanel';
import { SortPanel, type ShopSortOption } from '@/features/search/SortPanel';

interface MobileFilterButtonProps {
  availableFilters: AvailableFilter[];
  appliedBrand?: string;
  appliedSize?: string;
  appliedStockStatus?: string;
  appliedPriceMin?: number;
  appliedPriceMax?: number;
  currentSort?: ShopSortOption;
}

export function MobileFilterButton({
  availableFilters,
  appliedBrand,
  appliedSize,
  appliedStockStatus,
  appliedPriceMin,
  appliedPriceMax,
  currentSort,
}: MobileFilterButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
        style={{
          bottom:
            'calc(var(--mobile-tabbar-height) + var(--mobile-safe-area-bottom) + 1rem)',
        }}
        aria-label="Open filters"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        side="left"
        title="Filters & Sort"
      >
        <div className="space-y-8 p-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Sort</h3>
            <SortPanel
              sortOptions={['featured', 'price_asc', 'price_desc', 'newest']}
              currentSort={currentSort}
              onChange={() => setOpen(false)}
            />
          </div>
          <FilterPanel
            availableFilters={availableFilters}
            appliedBrand={appliedBrand}
            appliedSize={appliedSize}
            appliedStockStatus={appliedStockStatus}
            appliedPriceMin={appliedPriceMin}
            appliedPriceMax={appliedPriceMax}
            onChange={() => setOpen(false)}
          />
        </div>
      </Sheet>
    </>
  );
}
