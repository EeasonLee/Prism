'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ProductCard, mapCardItemToDisplay } from '@/features/product';
import { ProductCardSkeleton } from '@/features/product';
import type { ProductCardItem } from '@/features/product';
import type { ShopAvailableFilter, ShopSortOption } from '@/features/search';

interface CategoryProductGridProps {
  slug: string;
  initialProducts: ProductCardItem[];
  initialPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    brand?: string;
    size?: string;
    stockStatus?: string;
    priceMin?: number;
    priceMax?: number;
    sort?: ShopSortOption;
  };
}

export function CategoryProductGrid({
  slug,
  initialProducts,
  initialPagination,
  filters,
}: CategoryProductGridProps) {
  const [products, setProducts] = useState<ProductCardItem[]>(initialProducts);
  const [page, setPage] = useState(initialPagination.page);
  const [hasMore, setHasMore] = useState(
    initialPagination.page < initialPagination.totalPages
  );
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Reset state when filters or initial data change (e.g. after applying filters)
  useEffect(() => {
    setProducts(initialProducts);
    setPage(initialPagination.page);
    setHasMore(initialPagination.page < initialPagination.totalPages);
  }, [
    initialProducts,
    initialPagination.page,
    initialPagination.totalPages,
    filters,
  ]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const nextPage = page + 1;
    const params = new URLSearchParams();
    params.set('page', String(nextPage));
    params.set('pageSize', String(initialPagination.pageSize));
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.size) params.set('size', filters.size);
    if (filters.stockStatus) params.set('stock_status', filters.stockStatus);
    if (filters.priceMin !== undefined)
      params.set('price_min', String(filters.priceMin));
    if (filters.priceMax !== undefined)
      params.set('price_max', String(filters.priceMax));
    if (filters.sort) params.set('sort', filters.sort);

    try {
      const res = await fetch(`/api/categories/${slug}?${params.toString()}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: {
          items: ProductCardItem[];
          pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
          };
          availableFilters: ShopAvailableFilter[];
        };
      };

      const payload = json.data;
      if (json.success && payload) {
        setProducts(prev => [...prev, ...payload.items]);
        setPage(nextPage);
        setHasMore(nextPage < payload.pagination.totalPages);
      }
    } catch {
      // silently fail on auto-load; user can retry by scrolling again
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading, filters, slug, initialPagination.pageSize]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {products.map(product => (
          <li key={product.sku}>
            <ProductCard
              product={mapCardItemToDisplay(product)}
              fromCategory={slug}
            />
          </li>
        ))}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={`skeleton-${i}`}>
              <ProductCardSkeleton />
            </li>
          ))}
      </ul>

      <div
        ref={loaderRef}
        className="mt-8 flex items-center justify-center py-4"
      >
        {hasMore && !loading ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-brand" />
            <span>Loading more...</span>
          </div>
        ) : !hasMore && products.length > 0 ? (
          <span className="text-sm text-ink-muted"></span>
        ) : null}
      </div>
    </>
  );
}
