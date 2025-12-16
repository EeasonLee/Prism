'use client';

import { searchRecipes, searchRecipesByKeyword } from '@/lib/api/recipes';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Facets,
  PaginationInfo,
  Recipe,
  RecipeSearchParams,
  SearchRecipeItem,
  SelectedFilters,
} from '../types';

interface UseRecipesDataReturn {
  recipes: Recipe[];
  facets: Facets | null;
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: Error | null;
  refetch: (
    filters: SelectedFilters,
    page: number,
    pageSize: number
  ) => Promise<void>;
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

export function useRecipesData(
  initialRecipes: Recipe[],
  initialFacets: Facets | null,
  initialPagination: PaginationInfo | null
): UseRecipesDataReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [facets, setFacets] = useState<Facets | null>(initialFacets);
  const [pagination, setPagination] = useState<PaginationInfo | null>(
    initialPagination
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 使用 ref 跟踪是否是我们主动触发的 URL 更新
  const isUpdatingUrlRef = useRef(false);
  // 初始化为当前 URL 对应的参数，避免首屏重复请求
  const initialFilters = parseFiltersFromSearchParams(searchParams);
  const initialPage = Math.max(1, Number(searchParams.get('page')) || 1);
  const initialPageSize = Math.max(
    1,
    Number(searchParams.get('pageSize')) || initialPagination?.pageSize || 12
  );
  const lastRequestParamsRef = useRef<string>(
    JSON.stringify({
      filters: initialFilters,
      page: initialPage,
      pageSize: initialPageSize,
    })
  );

  const mapSearchItemToRecipe = useCallback(
    (item: SearchRecipeItem): Recipe => {
      return {
        id: item.id,
        title: item.highlight?.title || item.title,
        slug: item.slug,
        description: item.highlight?.summary || item.summary || '',
        summary: item.summary,
        featuredImage: item.thumbnail
          ? {
              url: item.thumbnail,
            }
          : null,
        categories: [],
        filters: [],
        cookTime: item.cook_time,
        difficulty: item.difficulty,
        rating: item.rating,
        updatedAt: item.updated_at,
        url: item.url,
      };
    },
    []
  );

  const refetch = useCallback(
    async (
      filters: SelectedFilters,
      page: number,
      pageSize: number,
      updateUrl = true
    ) => {
      // 生成请求参数的唯一标识，避免重复请求
      const requestKey = JSON.stringify({ filters, page, pageSize });
      if (lastRequestParamsRef.current === requestKey) {
        return; // 避免重复请求
      }
      lastRequestParamsRef.current = requestKey;

      setIsLoading(true);
      setError(null);

      try {
        const { searchQuery, ...restFilters } = filters;

        // 当存在关键字搜索时，调用新接口
        if (searchQuery && searchQuery.trim()) {
          const response = await searchRecipesByKeyword({
            q: searchQuery.trim(),
            page,
            pageSize,
          });

          setRecipes(response.data.map(mapSearchItemToRecipe));
          setFacets(null);
          setPagination(response.meta.pagination);
        } else {
          const params: RecipeSearchParams = {
            page,
            pageSize,
            includeFacets: true,
            ...restFilters,
          };

          const response = await searchRecipes(params);

          setRecipes(response.data);
          setFacets(response.meta.facets || null);
          setPagination(response.meta.pagination);
        }

        // 更新 URL 但不触发整页刷新
        if (updateUrl) {
          const urlParams = new URLSearchParams();
          urlParams.set('page', String(page));
          urlParams.set('pageSize', String(pageSize));

          Object.entries(restFilters).forEach(([key, values]) => {
            if (key === 'categoryId' && values) {
              urlParams.set('categoryId', String(values));
            } else if (Array.isArray(values) && values.length > 0) {
              values.forEach(value => {
                urlParams.append(key, String(value));
              });
            }
          });
          if (searchQuery && searchQuery.trim()) {
            urlParams.set('q', searchQuery.trim());
          }

          const newUrl = urlParams.toString();
          isUpdatingUrlRef.current = true;
          // 使用 replace 更新 URL，但不触发整页刷新
          router.replace(`/recipes?${newUrl}`, { scroll: false });
          // 延迟重置标志，确保 useEffect 不会误判
          setTimeout(() => {
            isUpdatingUrlRef.current = false;
          }, 100);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch recipes')
        );
        console.error('Failed to fetch recipes:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [router, mapSearchItemToRecipe]
  );

  // 当 URL 变化时（比如浏览器前进/后退），重新获取数据
  useEffect(() => {
    // 如果是我们主动更新的 URL，跳过
    if (isUpdatingUrlRef.current) {
      return;
    }

    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.max(1, Number(searchParams.get('pageSize')) || 12);
    const filters = parseFiltersFromSearchParams(searchParams);

    // 检查是否与当前数据一致，避免不必要的请求
    const requestKey = JSON.stringify({ filters, page, pageSize });
    if (lastRequestParamsRef.current === requestKey) {
      return;
    }

    lastRequestParamsRef.current = requestKey;
    refetch(filters, page, pageSize, false);
  }, [searchParams, refetch]);

  return {
    recipes,
    facets,
    pagination,
    isLoading,
    error,
    refetch,
  };
}
