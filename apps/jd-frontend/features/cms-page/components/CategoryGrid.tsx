'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CategoryGridProps } from '../types';
import type { ProductCardItem } from '@/features/product';
import { formatPrice } from '@prism/shared';
import { CategoryProductCard } from './CategoryProductCard';

export function CategoryGrid({ title, categories }: CategoryGridProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [showScrollArrows, setShowScrollArrows] = useState(false);
  const [products, setProducts] = useState<ProductCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const scroll = (dir: 'left' | 'right') => {
    tabsRef.current?.scrollBy({
      left: dir === 'left' ? -240 : 240,
      behavior: 'smooth',
    });
  };

  const activeCategory =
    categories.find(cat => String(cat.id) === activeCategoryId) ??
    categories[0];

  useEffect(() => {
    if (categories.length === 0) return;
    setActiveCategoryId(prev => {
      if (!prev) return String(categories[0].id);
      const stillExists = categories.some(cat => String(cat.id) === prev);
      return stillExists ? prev : String(categories[0].id);
    });
  }, [categories]);

  useEffect(() => {
    if (!activeCategoryId) return;

    let cancelled = false;
    const controller = new AbortController();

    const loadProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (typeof activeCategory?.magentoCategoryId === 'number') {
          params.set(
            'magentoCategoryId',
            String(activeCategory.magentoCategoryId)
          );
        } else if (activeCategory?.slug) {
          params.set('strapiCategorySlug', activeCategory.slug);
        } else {
          params.set('strapiCategoryId', activeCategoryId);
        }
        params.set('pageSize', '4');
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
  }, [activeCategoryId, activeCategory?.slug]);

  useEffect(() => {
    const updateScrollability = () => {
      const tabsEl = tabsRef.current;
      if (!tabsEl) return;
      setShowScrollArrows(tabsEl.scrollWidth > tabsEl.clientWidth + 1);
    };

    updateScrollability();
    window.addEventListener('resize', updateScrollability);

    return () => {
      window.removeEventListener('resize', updateScrollability);
    };
  }, [categories]);

  return (
    <section className="py-12 lg:py-20">
      <div className="px-6 lg:px-[8vw]">
        <h2
          className="heading-3 mb-8 text-center text-ink"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {title}
        </h2>

        <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-full border border-border">
          {showScrollArrows && (
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-surface to-transparent" />
          )}
          {showScrollArrows && (
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-surface to-transparent" />
          )}

          {showScrollArrows && (
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition hover:border-ink hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {showScrollArrows && (
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition hover:border-ink hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          <div
            ref={tabsRef}
            className={`no-scrollbar flex gap-1 overflow-x-auto py-1.5 ${
              showScrollArrows ? 'px-12' : 'px-1.5'
            }`}
          >
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(String(cat.id))}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  activeCategoryId === String(cat.id)
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
              {Array.from({ length: 4 }).map((_, i) => (
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
