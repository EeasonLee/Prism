'use client';

import { Loader } from '@/components/ui/loader';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
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

  // 使用 useMemo 缓存当前筛选条件和页面大小，避免频繁重新计算
  const currentFilters = useMemo(() => {
    return parseFiltersFromSearchParams(searchParams);
  }, [searchParams]);

  const currentPageSize = useMemo(() => {
    return Number(searchParams.get('pageSize')) || initialPageSize;
  }, [searchParams, initialPageSize]);

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
