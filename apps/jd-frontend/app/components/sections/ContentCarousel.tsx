'use client';

import { ArrowRight, Clock, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { ContentCarouselProps } from '@/lib/api/cms-page.types';

export function ContentCarousel({
  title,
  subtitle,
  contentType,
  items,
  showViewAll,
  viewAllLink,
}: ContentCarouselProps) {
  const [activeTab, setActiveTab] = useState<'recipe' | 'blog'>(
    contentType === 'mixed' ? 'recipe' : contentType
  );

  const filteredItems =
    contentType === 'mixed'
      ? items.filter(item => item.type === activeTab)
      : items;

  const defaultViewAllLink =
    viewAllLink || (activeTab === 'recipe' ? '/recipes' : '/blog');

  return (
    <section className="relative w-full overflow-hidden bg-surface py-12 lg:py-20">
      <div className="w-full px-6 lg:px-[8vw]">
        <div className="mb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              {subtitle && (
                <span className="micro-text mb-3 block text-brand">
                  {subtitle}
                </span>
              )}
              <h2
                className="heading-3 text-ink"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {title}
              </h2>
            </div>

            {contentType === 'mixed' && (
              <div className="flex gap-2 rounded-full border border-border bg-card p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('recipe')}
                  className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                    activeTab === 'recipe'
                      ? 'bg-brand text-brand-foreground'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Recipes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('blog')}
                  className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                    activeTab === 'blog'
                      ? 'bg-brand text-brand-foreground'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Blog
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          {activeTab === 'recipe' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredItems.map(item => (
                <Link
                  key={item.id}
                  href={item.link || '/recipes'}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.image.url}
                      alt={item.image.alternativeText || item.title}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-ink transition-colors group-hover:text-brand">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mb-4 line-clamp-2 text-sm text-ink-muted">
                        {item.description}
                      </p>
                    )}
                    {item.metadata && (
                      <div className="flex items-center gap-4 text-xs text-ink-faint">
                        {typeof item.metadata === 'object' &&
                          item.metadata !== null &&
                          'time' in item.metadata && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {String(item.metadata.time)}
                            </span>
                          )}
                        {typeof item.metadata === 'object' &&
                          item.metadata !== null &&
                          'author' in item.metadata && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {String(item.metadata.author)}
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {filteredItems.map(item => (
                <Link
                  key={item.id}
                  href={item.link || '/blog'}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <Image
                      src={item.image.url}
                      alt={item.image.alternativeText || item.title}
                      width={400}
                      height={250}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    {item.metadata && (
                      <div className="mb-3 flex items-center gap-3 text-xs text-ink-faint">
                        {typeof item.metadata === 'object' &&
                          item.metadata !== null &&
                          'date' in item.metadata && (
                            <span>{String(item.metadata.date)}</span>
                          )}
                        {typeof item.metadata === 'object' &&
                          item.metadata !== null &&
                          'readTime' in item.metadata && (
                            <>
                              <span>•</span>
                              <span>{String(item.metadata.readTime)}</span>
                            </>
                          )}
                      </div>
                    )}
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-ink transition-colors group-hover:text-brand">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="line-clamp-2 text-sm text-ink-muted">
                        {item.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {showViewAll && (
            <div className="mt-10 text-center">
              <Link
                href={defaultViewAllLink}
                className="inline-flex items-center gap-2 font-medium text-brand transition-all hover:gap-3"
              >
                View All {activeTab === 'recipe' ? 'Recipes' : 'Articles'}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
