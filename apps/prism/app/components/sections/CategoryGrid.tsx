'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CategoryGridProps } from '@/lib/api/cms-page.types';

export function CategoryGrid({ title, categories }: CategoryGridProps) {
  const tabsRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    tabsRef.current?.scrollBy({
      left: dir === 'left' ? -240 : 240,
      behavior: 'smooth',
    });
  };

  const enabledCategories = categories.filter(cat => cat.enabled);

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
              <a
                key={cat.categoryId}
                href={`/shop/${cat.categoryId}`}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-ink-muted transition-all hover:bg-ink hover:text-white"
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
