'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CategoryGridProps } from '@/lib/api/cms-page.types';
import type { ProductCardItem } from '@/lib/api/bff/product/types';
import { formatPrice } from '@/lib/format-price';
import { CategoryProductCard } from './CategoryProductCard';

export function CategoryGrid({ title, categories }: CategoryGridProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [products, setProducts] = useState<ProductCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const scroll = (dir: 'left' | 'right') => {
    tabsRef.current?.scrollBy({
      left: dir === 'left' ? -240 : 240,
      behavior: 'smooth',
    });
  };

  const enabledCategories = categories.filter(cat => cat.enabled);
  const activeCategory =
    enabledCategories.find(cat => cat.categoryId === activeCategoryId) ??
    enabledCategories[0];

  useEffect(() => {
    if (enabledCategories.length === 0) return;
    setActiveCategoryId(prev => {
      if (!prev) return enabledCategories[0].categoryId;
      const stillExists = enabledCategories.some(
        cat => cat.categoryId === prev
      );
      return stillExists ? prev : enabledCategories[0].categoryId;
    });
  }, [enabledCategories]);

  useEffect(() => {
    if (!activeCategoryId) return;

    let cancelled = false;
    const controller = new AbortController();

    const loadProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('categoryUrlKey', activeCategoryId);
        params.set('pageSize', '8');
        const res = await fetch(`/api/deal-products?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          setProducts(json.data.items ?? []);
        }
        if (!cancelled && (!json.success || !json.data)) {
          setProducts([]);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeCategoryId]);

  return (
    <section className="py-12 lg:py-20">
      <div className="px-6 lg:px-[8vw]">
        <h2
          className="heading-3 mb-8 text-center text-ink"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {title}
        </h2>

        <div className="relative overflow-hidden rounded-full border border-border">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-surface to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-surface to-transparent" />

          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition hover:border-ink hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition hover:border-ink hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            ref={tabsRef}
            className="no-scrollbar flex gap-1 overflow-x-auto px-12 py-1.5"
          >
            {enabledCategories.map(cat => (
              <button
                key={cat.categoryId}
                type="button"
                onClick={() => setActiveCategoryId(cat.categoryId)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  activeCategoryId === cat.categoryId
                    ? 'bg-ink text-white'
                    : 'text-ink-muted hover:bg-ink hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {loading && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map(product => {
                const priceValue = product.price.value;
                const originalPrice = product.originalPrice;
                const hasDiscount =
                  priceValue != null &&
                  originalPrice != null &&
                  originalPrice > priceValue;

                return (
                  <CategoryProductCard
                    key={product.sku}
                    href={
                      product.urlKey
                        ? `/products/${product.urlKey}`
                        : `/products/${product.sku}`
                    }
                    name={product.displayName}
                    image={product.image}
                    price={priceValue}
                    currency={product.price.currency}
                    badge={hasDiscount ? 'Sale' : product.promotionLabel}
                    badgeStyle={hasDiscount ? 'brand' : 'dark'}
                    tagline={
                      hasDiscount && originalPrice != null
                        ? formatPrice(originalPrice, product.price.currency)
                        : null
                    }
                    ratingSummary={product.ratingPercentage}
                    reviewCount={product.reviewCount}
                  />
                );
              })}
            </div>
          )}

          {!loading && loaded && products.length === 0 && activeCategory && (
            <p className="text-sm text-ink-muted">
              No products found in {activeCategory.label}.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
