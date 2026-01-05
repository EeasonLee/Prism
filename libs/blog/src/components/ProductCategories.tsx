'use client';

import { OptimizedImage } from '@prism/ui/components/OptimizedImage';
import { PageContainer } from '@prism/ui/components/PageContainer';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CategoryDetail } from '../api/types';

interface ProductCategoriesProps {
  categories: CategoryDetail[];
  title?: string;
}

const ITEMS_PER_PAGE = 6;

export function ProductCategories({
  categories,
  title = 'By Product',
}: ProductCategoriesProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = useMemo(
    () => Math.ceil(categories.length / ITEMS_PER_PAGE),
    [categories.length]
  );

  const currentCategories = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return categories.slice(start, end);
  }, [categories, currentPage]);

  const handlePrev = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  return (
    <section>
      <PageContainer>
        <div className="mb-8">
          <h2 className="text-center text-3xl font-bold text-gray-900 lg:text-4xl">
            {title}
          </h2>
        </div>

        <div className="relative flex items-center gap-4">
          {/* 左箭头 */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous page"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
          )}

          {/* 分类网格 */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {currentCategories.map(category => {
                return (
                  <Link
                    key={category.id}
                    href={`/blog/${category.slug}`}
                    className="group flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
                  >
                    {/* 图标图片 */}
                    <div className="relative mb-3 h-24 w-24 overflow-hidden rounded-lg bg-gray-50 lg:h-28 lg:w-28">
                      <OptimizedImage
                        src={category.icon || null}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 160px, 180px"
                        preferredFormat="medium"
                      />
                    </div>

                    {/* 分类名称 */}
                    <h3 className="text-center text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                      {category.name}
                    </h3>
                  </Link>
                );
              })}
            </div>

            {/* 分页指示器 */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
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

          {/* 右箭头 */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label="Next page"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              <ArrowRight className="h-5 w-5 text-gray-700" />
            </button>
          )}
        </div>
      </PageContainer>
    </section>
  );
}
