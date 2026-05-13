'use client';

import { ArrowRight, Clock, User } from 'lucide-react';
import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { useState } from 'react';
import type { ContentCarouselProps } from '../types';

export function ContentCarousel({
  title,
  subtitle,
  recipe,
  article,
  showViewAll,
  viewAllLink,
}: ContentCarouselProps) {
  const hasRecipe = recipe.length > 0;
  const hasArticle = article.length > 0;
  const isMixed = hasRecipe && hasArticle;

  const [activeTab, setActiveTab] = useState<'recipe' | 'blog'>(
    hasRecipe ? 'recipe' : 'blog'
  );

  const filteredItems = activeTab === 'recipe' ? recipe : article;

  const defaultViewAllLink =
    viewAllLink || (activeTab === 'recipe' ? '/recipes' : '/blog');

  return (
    <section className="relative w-full overflow-hidden bg-surface py-12 lg:py-20">
      <div className="w-full px-6 lg:px-[8vw]">
        <div className="mb-8">
          <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between">
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

            {isMixed && (
              <div className="flex w-full gap-2 rounded-full border border-border bg-card p-1 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('recipe')}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all sm:flex-none sm:px-6 sm:py-2.5 ${
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
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all sm:flex-none sm:px-6 sm:py-2.5 ${
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
            <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {filteredItems.map(item => (
                <Link
                  key={item.id}
                  href={item.link || '/recipes'}
                  className="block w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card sm:w-auto"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <OptimizedImage
                      src={item.image.url}
                      alt={item.image.alternativeText || item.title}
                      fill
                      maxDisplayWidth={360}
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-ink">
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
            <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar lg:grid lg:grid-cols-3">
              {filteredItems.map(item => (
                <Link
                  key={item.id}
                  href={item.link || '/blog'}
                  className="block w-[85vw] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card lg:w-auto"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <OptimizedImage
                      src={item.image.url}
                      alt={item.image.alternativeText || item.title}
                      fill
                      maxDisplayWidth={480}
                      sizes="(max-width: 1024px) 85vw, 33vw"
                      className="object-cover"
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
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-ink">
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

          {showViewAll && filteredItems.length > 0 && (
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
