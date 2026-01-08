'use client';

import type { HeroSlide } from '@/app/components/HeroCarousel';
import { HeroCarousel } from '@/app/components/HeroCarousel';
import { Loader } from '@prism/ui/components/loader';
import { PageContainer } from '@prism/ui/components/PageContainer';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FiltersPanel } from './components/FiltersPanel';
import { Pagination } from './components/Pagination';
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
  carouselSlides?: HeroSlide[];
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
  page: _initialPage,
  pageSize: initialPageSize,
  carouselSlides = [],
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
    void refetch(currentFilters, targetPage, currentPageSize);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Carousel */}
      {carouselSlides.length > 0 && (
        <div className="relative">
          <HeroCarousel
            slides={carouselSlides}
            autoPlayInterval={5000}
            showIndicators
            showNavigation
            showContent={false}
          />
        </div>
      )}

      <PageContainer className="py-8">
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
                  {pagination && (
                    <div className="mt-8">
                      <Pagination
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPageSizeChange={newPageSize => {
                          void refetch(currentFilters, 1, newPageSize);
                        }}
                        isLoading={isLoading}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </PageContainer>
    </div>
  );
}
