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
  // 首屏 SSR：isLoading 初始为 false，因为数据已经通过 props 传入
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 使用 ref 跟踪是否是我们主动触发的 URL 更新
  const isUpdatingUrlRef = useRef(false);
  // 标记是否已完成首次渲染（服务端数据已使用）
  const isInitialMountRef = useRef(true);
  // 标记服务端数据是否已使用（避免首次渲染时发起请求）
  const hasUsedServerDataRef = useRef(false);
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
      // 处理图片 URL：thumbnail 可能是相对路径或完整 URL
      let imageUrl = item.thumbnail;
      if (imageUrl) {
        // 如果是完整 URL，直接使用
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          // 完整 URL，直接使用
        } else {
          // 如果是相对路径，确保以 / 开头
          imageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
        }
      }

      return {
        id: item.id,
        // 保存高亮版本和原始版本，用于渲染
        title: item.highlight?.title || item.title,
        slug: item.slug,
        description: item.highlight?.summary || item.summary || '',
        summary: item.summary,
        featuredImage: imageUrl
          ? {
              url: imageUrl,
              alternativeText: item.title,
            }
          : null,
        categories: item.categories || [],
        filters: [],
        cookTime: item.cook_time,
        difficulty: item.difficulty,
        rating: item.rating,
        updatedAt: item.updated_at,
        url: item.url,
        // 保存高亮信息，用于渲染
        highlight: item.highlight,
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
    // 首次渲染时，标记服务端数据已使用
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const page = Math.max(1, Number(searchParams.get('page')) || 1);
      const pageSize = Math.max(1, Number(searchParams.get('pageSize')) || 12);
      const filters = parseFiltersFromSearchParams(searchParams);
      const requestKey = JSON.stringify({ filters, page, pageSize });

      // 如果服务端数据与当前 URL 参数匹配，标记已使用服务端数据，不发起请求
      if (lastRequestParamsRef.current === requestKey) {
        hasUsedServerDataRef.current = true;
        return; // 首屏 SSR：直接使用服务端数据，不显示 loading
      }

      // 如果数据不匹配，说明 URL 参数与服务端数据不一致，需要重新获取
      // 但这种情况应该很少见，因为服务端应该根据 URL 参数返回对应数据
      hasUsedServerDataRef.current = true;
    }

    // 如果是我们主动更新的 URL，跳过（避免循环请求）
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

    // 只有在 URL 真正变化且已使用过服务端数据后，才发起客户端请求
    // 此时显示 loading 是合理的（用户交互导致的请求）
    lastRequestParamsRef.current = requestKey;
    void refetch(filters, page, pageSize, false);
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
