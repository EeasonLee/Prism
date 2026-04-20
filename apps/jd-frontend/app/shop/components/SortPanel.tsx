'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export type ShopSortOption = 'featured' | 'price_asc' | 'price_desc' | 'newest';

const SORT_LABELS: Record<ShopSortOption, string> = {
  featured: 'Featured',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  newest: 'Newest',
};

interface SortPanelProps {
  sortOptions: ShopSortOption[];
  currentSort?: ShopSortOption;
  onChange?: () => void;
}

export function SortPanel({
  sortOptions,
  currentSort,
  onChange,
}: SortPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSort = useCallback(
    (sort: ShopSortOption) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      if (sort === 'featured') {
        params.delete('sort');
      } else {
        params.set('sort', sort);
      }
      router.push(`${pathname}?${params.toString()}`);
      onChange?.();
    },
    [router, pathname, searchParams, onChange]
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-ink-muted">Sort:</span>
      <select
        value={currentSort ?? 'featured'}
        onChange={e => handleSort(e.target.value as ShopSortOption)}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand"
        aria-label="Sort products"
      >
        {sortOptions.map(option => (
          <option key={option} value={option}>
            {SORT_LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
