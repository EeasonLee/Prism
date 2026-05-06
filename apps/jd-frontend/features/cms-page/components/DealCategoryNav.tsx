'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DealCategoryNavProps } from '../types';

export function DealCategoryNav({ title, items }: DealCategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: dir === 'left' ? -300 : 300,
      behavior: 'smooth',
    });
  };

  if (items.length === 0) return null;

  return (
    <section className="py-10 lg:py-16">
      <div className="px-6 lg:px-[8vw]">
        {title && (
          <h2
            className="heading-3 mb-6 text-center text-ink"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {title}
          </h2>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-sm transition-colors hover:border-ink"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-sm transition-colors hover:border-ink"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            ref={scrollRef}
            className="no-scrollbar flex gap-4 overflow-x-auto px-4 py-2"
          >
            {items.map(item => (
              <Link
                key={item.id}
                href={item.link ?? `/shop/${item.categoryUrlKey}`}
                onClick={e => {
                  const targetId = `deal-section-${item.categoryUrlKey}`;
                  const target = document.getElementById(targetId);
                  if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }
                }}
                className="group shrink-0"
              >
                <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border transition-all hover:border-brand md:h-28 md:w-28">
                  <Image
                    src={item.image.url}
                    alt={item.label}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="112px"
                    loading="lazy"
                  />
                </div>
                <p className="mt-2 text-center text-sm font-medium text-ink group-hover:text-brand">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
