'use client';

import { useState, useTransition } from 'react';
import type {
  ProductCardItem,
  DiscoveryPagination,
} from '../../../lib/api/discovery/types';
import { DiscoveryProductCard } from './DiscoveryProductCard';

interface ProductGridProps {
  slug: string;
  initialItems: ProductCardItem[];
  initialPagination: DiscoveryPagination;
  searchParams?: Record<string, string>;
}

export function ProductGrid({
  slug,
  initialItems,
  initialPagination,
  searchParams = {},
}: ProductGridProps) {
  const [items, setItems] = useState<ProductCardItem[]>(initialItems);
  const [pagination, setPagination] =
    useState<DiscoveryPagination>(initialPagination);
  const [isPending, startTransition] = useTransition();

  const hasMore = pagination.page < pagination.totalPages;

  function handleLoadMore() {
    startTransition(async () => {
      const nextPage = pagination.page + 1;
      const params = new URLSearchParams({
        ...searchParams,
        page: String(nextPage),
      });
      const res = await fetch(`/api/discovery/${slug}?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(prev => [...prev, ...(data.items as ProductCardItem[])]);
      setPagination(data.pagination as DiscoveryPagination);
    });
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {items.map(item => (
          <li key={item.sku}>
            <DiscoveryProductCard item={item} />
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="rounded-lg border border-border px-6 py-2.5 text-sm text-ink transition hover:bg-surface disabled:opacity-50"
          >
            {isPending ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      {!hasMore && items.length > 0 && pagination.totalPages > 1 && (
        <p className="mt-8 text-center text-sm text-ink-muted">
          All {pagination.total} products loaded
        </p>
      )}
    </div>
  );
}
