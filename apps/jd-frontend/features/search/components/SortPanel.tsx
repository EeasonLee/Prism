'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@prism/ui';

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
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      onChange?.();
    },
    [router, pathname, searchParams, onChange]
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-ink-muted">Sort:</span>
      <Select
        value={currentSort ?? 'featured'}
        onValueChange={value => handleSort(value as ShopSortOption)}
      >
        <SelectTrigger
          className="h-9 min-h-touch w-[10.5rem] rounded-lg border-border bg-background px-3 text-sm text-ink"
          aria-label="Sort products"
        >
          <SelectValue placeholder="Featured" />
        </SelectTrigger>
        <SelectContent align="end" className="rounded-xl border-border">
          {sortOptions.map(option => (
            <SelectItem key={option} value={option}>
              {SORT_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
