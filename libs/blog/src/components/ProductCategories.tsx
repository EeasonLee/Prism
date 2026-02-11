'use client';

import { OptimizedImage } from '@prism/ui/components/OptimizedImage';
import { PageContainer } from '@prism/ui/components/PageContainer';
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
          <h2 className="text-center text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl">
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
              className="hidden min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white sm:flex"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
          )}

          {/* 分类网格：移动端单行 4 列，sm 及以上多行 */}
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {currentCategories.map(category => {
                return (
                  <Link
                    key={category.id}
                    href={`/blog/${category.slug}`}
                    className="group flex min-h-[44px] flex-col items-center overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-gray-300 hover:shadow-md md:p-4"
                  >
                    {/* 图标图片：overflow-hidden + rounded-lg 防止图片遮住卡片边框 */}
                    <div className="relative mb-2 h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50 sm:mb-3 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
                      <OptimizedImage
                        src={category.icon || null}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 160px, 180px"
                        preferredFormat="medium"
                      />
                    </div>

                    {/* 分类名称：移动端单行省略，sm 及以上最多两行 */}
                    <h3 className="line-clamp-1 text-center text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600 sm:line-clamp-2 sm:min-h-[2.5rem]">
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
                        ? 'w-8 bg-gray-900'
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
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
              className="hidden min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white sm:flex"
            >
              <ArrowRight className="h-5 w-5 text-gray-700" />
            </button>
          )}
        </div>
      </PageContainer>
    </section>
  );
}
