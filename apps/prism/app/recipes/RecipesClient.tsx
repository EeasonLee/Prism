'use client';

import { Loader } from '@/components/ui/loader';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FiltersPanel } from './components/FiltersPanel';
import { RecipeGrid } from './components/RecipeGrid';
import { RecipeHeader } from './components/RecipeHeader';
import { useRecipesData } from './hooks/useRecipesData';
import type {
  Facets,
  FilterType,
  PaginationInfo,
  Recipe,
  SelectedFilters,
} from './types';

interface RecipesClientProps {
  recipes: Recipe[];
  facets: Facets | null;
  pagination: PaginationInfo | null;
  filterTypes: FilterType[];
  selectedFilters: SelectedFilters;
  page: number;
  pageSize: number;
}

function parseFiltersFromSearchParams(
  searchParams: URLSearchParams
): SelectedFilters {
  return {
    recipeTypes: searchParams.getAll('recipeTypes').map(Number).filter(Boolean),
    ingredients: searchParams.getAll('ingredients').map(Number).filter(Boolean),
    cuisines: searchParams.getAll('cuisines').map(Number).filter(Boolean),
    dishTypes: searchParams.getAll('dishTypes').map(Number).filter(Boolean),
    specialDiets: searchParams
      .getAll('specialDiets')
      .map(Number)
      .filter(Boolean),
    holidaysEvents: searchParams
      .getAll('holidaysEvents')
      .map(Number)
      .filter(Boolean),
    productTypes: searchParams
      .getAll('productTypes')
      .map(Number)
      .filter(Boolean),
    categoryId: searchParams.get('categoryId')
      ? Number(searchParams.get('categoryId'))
      : undefined,
    searchQuery: searchParams.get('q') || undefined,
  };
}

export function RecipesClient({
  recipes: initialRecipes,
  facets: initialFacets,
  pagination: initialPagination,
  filterTypes,
  selectedFilters: initialSelectedFilters,
  page: initialPage,
  pageSize: initialPageSize,
}: RecipesClientProps) {
  const searchParams = useSearchParams();
  const { recipes, facets, pagination, isLoading, refetch } = useRecipesData(
    initialRecipes,
    initialFacets,
    initialPagination
  );

  // 使用 useState 管理筛选条件和页面大小，初始值使用 props（服务端数据）
  // 这样可以确保服务端和客户端首次渲染一致，避免 hydration 不匹配
  const [currentFilters, setCurrentFilters] = useState<SelectedFilters>(
    initialSelectedFilters
  );
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize);

  // 在客户端 hydration 后，同步 URL 参数（仅在 URL 变化时更新）
  useEffect(() => {
    const urlFilters = parseFiltersFromSearchParams(searchParams);
    const urlPageSize = Number(searchParams.get('pageSize')) || initialPageSize;

    // 只在 URL 参数与当前状态不同时更新
    if (JSON.stringify(urlFilters) !== JSON.stringify(currentFilters)) {
      setCurrentFilters(urlFilters);
    }
    if (urlPageSize !== currentPageSize) {
      setCurrentPageSize(urlPageSize);
    }
  }, [searchParams, currentFilters, currentPageSize, initialPageSize]);

  // 检查是否有可用的筛选选项
  const hasAvailableFilters = useMemo(() => {
    if (!facets || !filterTypes || filterTypes.length === 0) {
      return false;
    }

    const filterTypeKeyMap: Record<string, keyof Facets> = {
      'recipe-type': 'recipe-type',
      'main-ingredients': 'main-ingredients',
      cuisine: 'cuisine',
      'dish-type': 'dish-type',
      'special-diets': 'special-diets',
      'holidays-events': 'holidays-events',
      'product-type': 'product-type',
    };

    // 检查是否有任何筛选类型有可用的选项
    return filterTypes.some(filterType => {
      const facetKey = filterTypeKeyMap[filterType.value] as keyof Facets;
      if (!facetKey) return false;
      const options = facets[facetKey];
      return options && Array.isArray(options) && options.length > 0;
    });
  }, [facets, filterTypes]);

  const handlePageChange = (targetPage: number) => {
    refetch(currentFilters, targetPage, currentPageSize);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Static inspiration section */}
      <div className="bg-[#f6f6f6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center lg:gap-12 lg:px-8">
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              Recipe Inspiration
            </p>
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Our recipe library is here to help you get the most out of your
              Joydeem® appliances and cookware.
            </h1>
            <p className="text-base leading-relaxed text-gray-700">
              Whether you need ideas for breakfast, lunch, dinner, dessert, or
              snacks, we have.
            </p>
          </div>
          <div className="flex-1">
            <div className="overflow-hidden rounded-lg shadow-md">
              <Image
                src="https://www.cuisinart.com/dw/image/v2/ABAF_PRD/on/demandware.static/-/Sites-us-cuisinart-sfra-Library/default/dw75c0fcb3/images/recipe-Images/07_28_fusionfrittata.jpg?sw=704&sh=396&q=100"
                alt="Recipe inspiration"
                width={704}
                height={396}
                className="h-full w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 704px"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {hasAvailableFilters && (
            <aside className="w-full lg:w-64 lg:flex-shrink-0">
              <FiltersPanel
                filterTypes={filterTypes}
                facets={facets}
                selectedFilters={currentFilters}
                pageSize={currentPageSize}
                onFilterChange={(filters, page, pageSize) =>
                  refetch(filters, page, pageSize)
                }
              />
            </aside>
          )}

          <main className="min-w-0 flex-1">
            <RecipeHeader
              totalRecipes={pagination?.total ?? 0}
              showingRecipes={recipes.length}
              pageSize={currentPageSize}
              selectedFilters={currentFilters}
              onPageSizeChange={(filters, page, pageSize) =>
                refetch(filters, page, pageSize)
              }
              onSearch={(filters, page, pageSize, searchQuery) =>
                refetch({ ...filters, searchQuery }, page, pageSize)
              }
            />
            <div className="relative">
              {isLoading && (
                <div className="pointer-events-auto absolute inset-0 z-10 flex items-start justify-center bg-white/60 backdrop-blur-[2px] pt-6">
                  <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-2 shadow-sm">
                    <Loader size="sm" className="text-gray-700" />
                    <span className="text-sm text-gray-700">
                      Loading recipes...
                    </span>
                  </div>
                </div>
              )}

              {recipes.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-8 text-center">
                  <p className="text-gray-600">No recipes found</p>
                </div>
              ) : (
                <>
                  <RecipeGrid recipes={recipes} />
                  {pagination && pagination.pageCount > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      {pagination.page > 1 ? (
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={isLoading}
                          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                      ) : (
                        <span className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400">
                          Previous
                        </span>
                      )}
                      <span className="px-4 text-sm text-gray-700">
                        Page {pagination.page} of {pagination.pageCount}
                      </span>
                      {pagination.page < pagination.pageCount ? (
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={isLoading}
                          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      ) : (
                        <span className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400">
                          Next
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
