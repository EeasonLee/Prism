'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ProductCardItem } from '@/features/product/bff-types';
import type { DealProductBlockItem } from './types';
import { DealProductCard } from './DealProductCard';

interface LazyDealProductBlockProps {
  block: DealProductBlockItem;
}

const LAYOUT_CLASSES = {
  'grid-2': 'grid-cols-2',
  'grid-3': 'grid-cols-2 md:grid-cols-3',
  'grid-4': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  'grid-6': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
};

function getPageSizeByLayout(layout: DealProductBlockItem['layout']): number {
  switch (layout) {
    case 'grid-2':
      return 4;
    case 'grid-3':
      return 6;
    case 'grid-6':
      return 6;
    case 'grid-4':
    default:
      return 8;
  }
}

function sectionId(categoryUrlKey: string): string {
  return `deal-section-${categoryUrlKey}`;
}

export function LazyDealProductBlock({ block }: LazyDealProductBlockProps) {
  const [products, setProducts] = useState<ProductCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadProducts = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (/^\d+$/.test(block.categoryUrlKey)) {
        params.set('strapiCategoryId', block.categoryUrlKey);
      } else {
        params.set('strapiCategorySlug', block.categoryUrlKey);
      }
      params.set('pageSize', String(getPageSizeByLayout(block.layout)));
      const res = await fetch(`/api/deal-products?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProducts(json.data.items ?? []);
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [block.categoryUrlKey, block.layout, loaded, loading]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          void loadProducts();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadProducts]);

  return (
    <div
      ref={ref}
      id={sectionId(block.categoryUrlKey)}
      className="py-8 lg:py-12"
    >
      <div className="mb-6 flex items-end justify-between">
        <h3
          className="text-xl font-bold text-ink md:text-2xl"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {block.categoryName}
        </h3>
        {block.categoryLink && (
          <Link
            href={block.categoryLink}
            className="group/link flex items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            View All
            <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        )}
      </div>

      {loading && (
        <div className={`grid gap-4 ${LAYOUT_CLASSES[block.layout]}`}>
          {Array.from({ length: getPageSizeByLayout(block.layout) }).map(
            (_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-xl bg-muted"
              />
            )
          )}
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className={`grid gap-4 ${LAYOUT_CLASSES[block.layout]}`}>
          {products.map(product => (
            <DealProductCard key={product.sku} product={product} />
          ))}
        </div>
      )}

      {!loading && loaded && products.length === 0 && (
        <p className="text-sm text-ink-muted">
          No products found in {block.categoryName}.
        </p>
      )}
    </div>
  );
}
