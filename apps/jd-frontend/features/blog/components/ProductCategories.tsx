'use client';

import { OptimizedImage, PageContainer } from '@prism/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CategoryDetail } from '../api/types';

interface ProductCategoriesProps {
  categories: CategoryDetail[];
  title?: string;
}

const ITEMS_PER_PAGE_DESKTOP = 6;
const ITEMS_PER_PAGE_MOBILE = 4;

export function ProductCategories({
  categories,
  title = 'By Product',
}: ProductCategoriesProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(true);

  const itemsPerPage =
    typeof window === 'undefined'
      ? ITEMS_PER_PAGE_MOBILE
      : isMobile
      ? ITEMS_PER_PAGE_MOBILE
      : ITEMS_PER_PAGE_DESKTOP;

  const totalPages = useMemo(
    () => Math.ceil(categories.length / itemsPerPage),
    [categories.length, itemsPerPage]
  );

  const currentCategories = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return categories.slice(start, end);
  }, [categories, currentPage, itemsPerPage]);

  const desktopColumnsClass = useMemo(() => {
    const desktopColumns = Math.min(
      currentCategories.length,
      ITEMS_PER_PAGE_DESKTOP
    );

    switch (desktopColumns) {
      case 1:
        return 'lg:grid-cols-1';
      case 2:
        return 'lg:grid-cols-2';
      case 3:
        return 'lg:grid-cols-3';
      case 4:
        return 'lg:grid-cols-4';
      case 5:
        return 'lg:grid-cols-5';
      default:
        return 'lg:grid-cols-6';
    }
  }, [currentCategories.length]);

  const handlePrev = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const handler = () => setIsMobile(!mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  if (!categories || categories.length === 0) {
    return null;
  }

  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  return (
    <section>
      <PageContainer>
        <div className="mb-4 md:mb-8">
          <h2 className="text-center text-2xl font-bold text-ink md:text-3xl lg:text-4xl">
            {title}
          </h2>
        </div>

        <div className="relative flex items-center gap-2 sm:gap-4">
          {/* 左箭头：仅 sm 及以上显示，移动端不显示 */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous page"
              className="hidden min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-all hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-card sm:flex"
            >
              <ArrowLeft className="h-5 w-5 text-ink" />
            </button>
          )}

          {/* 分类网格：移动端单行 4 列，sm 及以上多行 */}
          <div className="min-w-0 flex-1">
            <div
              className={`mx-auto grid w-fit grid-cols-4 gap-2 sm:w-full sm:grid-cols-3 sm:gap-4 ${desktopColumnsClass}`}
            >
              {currentCategories.map(category => {
                return (
                  <Link
                    key={category.id}
                    href={`/blog/${category.slug}`}
                    className="group flex min-h-[44px] flex-col items-center overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:border-brand/30 hover:shadow-md md:p-4"
                  >
                    {/* 图标图片：overflow-hidden + rounded-lg 防止图片遮住卡片边框 */}
                    <div className="relative mb-2 h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted sm:mb-3 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
                      <OptimizedImage
                        src={category.icon || null}
                        alt={category.name}
                        fill
                        maxDisplayWidth={180}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 160px, 180px"
                        preferredFormat="medium"
                      />
                    </div>

                    {/* 分类名称：移动端单行省略，sm 及以上最多两行 */}
                    <h3 className="line-clamp-1 text-center text-sm font-semibold text-ink transition-colors group-hover:text-brand sm:line-clamp-2 sm:min-h-[2.5rem]">
                      {category.name}
                    </h3>
                  </Link>
                );
              })}
            </div>

            {/* 分页指示器 */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2 md:mt-6">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePageClick(index)}
                    aria-label={`Go to page ${index + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      index === currentPage
                        ? 'w-8 bg-ink'
                        : 'w-2 bg-border hover:bg-ink-faint'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 右箭头：仅 sm 及以上显示，移动端不显示 */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label="Next page"
              className="hidden min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-all hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-card sm:flex"
            >
              <ArrowRight className="h-5 w-5 text-ink" />
            </button>
          )}
        </div>
      </PageContainer>
    </section>
  );
}
