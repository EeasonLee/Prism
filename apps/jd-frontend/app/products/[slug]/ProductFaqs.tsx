'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ProductSpecificationGroup } from '@/features/product';
import { cn } from '@prism/shared';

interface ProductFaqsProps {
  groups: ProductSpecificationGroup[];
}

export function ProductFaqs({ groups }: ProductFaqsProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  if (groups.length === 0) return null;

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section aria-labelledby="product-faqs-heading" className="py-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <h2
          id="product-faqs-heading"
          className="heading-3 mb-8 text-center text-ink"
        >
          FAQs
        </h2>

        <div className="space-y-4">
          {groups.map(group => {
            const isOpen = openIds.has(group.id);

            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <button
                  type="button"
                  onClick={() => toggle(group.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-base font-semibold text-ink sm:text-lg">
                    {group.title}
                  </h3>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 shrink-0 text-ink-muted transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>

                <div
                  className={cn(
                    'grid transition-all duration-200 ease-in-out',
                    isOpen
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <dl className="divide-y divide-border border-t border-border">
                      {group.rows.map(row => (
                        <div
                          key={`${group.id}-${row.key}`}
                          className={cn(
                            'grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-6 sm:px-6',
                            row.highlighted && 'bg-brand/5'
                          )}
                        >
                          <dt className="text-sm font-medium text-ink-muted">
                            {row.label}
                          </dt>
                          <dd className="text-sm leading-6 text-ink">
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
