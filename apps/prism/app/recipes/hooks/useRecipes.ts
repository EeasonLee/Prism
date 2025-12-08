'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getFilterTypes, searchRecipes } from '../../../lib/api/recipes';
import { debounce } from '../../../lib/utils/debounce';
import type {
  Facets,
  FilterType,
  PaginationInfo,
  Recipe,
  RecipeSearchParams,
  SelectedFilters,
} from '../types';

interface UseRecipesState {
  recipes: Recipe[];
  filterTypes: FilterType[];
  facets: Facets | null;
  pagination: PaginationInfo | null;
  selectedFilters: SelectedFilters;
  loading: boolean;
  error: Error | null;
}

const initialSelectedFilters: SelectedFilters = {
  recipeTypes: [],
  ingredients: [],
  cuisines: [],
  dishTypes: [],
  specialDiets: [],
  holidaysEvents: [],
  productTypes: [],
};

export function useRecipes(initialPageSize = 12) {
  const [state, setState] = useState<UseRecipesState>({
    recipes: [],
    filterTypes: [],
    facets: null,
    pagination: null,
    selectedFilters: initialSelectedFilters,
    loading: true,
    error: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 构建搜索参数
  const buildSearchParams = useCallback(
    (currentPage: number, currentPageSize: number): RecipeSearchParams => {
      return {
        page: currentPage,
        pageSize: currentPageSize,
        includeFacets: true, // 必须包含 facets
        recipeTypes:
          state.selectedFilters.recipeTypes.length > 0
            ? state.selectedFilters.recipeTypes
            : undefined,
        ingredients:
          state.selectedFilters.ingredients.length > 0
            ? state.selectedFilters.ingredients
            : undefined,
        cuisines:
          state.selectedFilters.cuisines.length > 0
            ? state.selectedFilters.cuisines
            : undefined,
        dishTypes:
          state.selectedFilters.dishTypes.length > 0
            ? state.selectedFilters.dishTypes
            : undefined,
        specialDiets:
          state.selectedFilters.specialDiets.length > 0
            ? state.selectedFilters.specialDiets
            : undefined,
        holidaysEvents:
          state.selectedFilters.holidaysEvents.length > 0
            ? state.selectedFilters.holidaysEvents
            : undefined,
        productTypes:
          state.selectedFilters.productTypes.length > 0
            ? state.selectedFilters.productTypes
            : undefined,
      };
    },
    [state.selectedFilters]
  );

  // 执行搜索
  const performSearch = useCallback(
    async (currentPage: number, currentPageSize: number) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const params = buildSearchParams(currentPage, currentPageSize);
        const response = await searchRecipes(params);

        setState(prev => ({
          ...prev,
          recipes: response.data,
          facets: response.meta.facets || null,
          pagination: response.meta.pagination,
          loading: false,
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Unknown error'),
        }));
      }
    },
    [buildSearchParams]
  );

  // 初始化：获取筛选类型和初始数据
  useEffect(() => {
    const init = async () => {
      try {
        // 获取筛选类型
        const typesResponse = await getFilterTypes();
        setState(prev => ({ ...prev, filterTypes: typesResponse.data }));

        // 获取初始食谱数据
        await performSearch(1, pageSize);
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Unknown error'),
        }));
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  // 使用 ref 存储防抖函数
  const debouncedSearchRef = useRef<
    ((page: number, size: number) => void) | null
  >(null);

  // 初始化防抖函数
  useEffect(() => {
    const searchFn = (currentPage: number, currentPageSize: number) => {
      performSearch(currentPage, currentPageSize);
    };
    debouncedSearchRef.current = debounce(
      searchFn as (...args: unknown[]) => unknown,
      300
    ) as (page: number, size: number) => void; // 300ms 防抖延迟

    return () => {
      // 清理防抖函数
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current = null;
      }
    };
  }, [performSearch]);

  // 筛选条件变化时重新搜索（使用防抖）
  useEffect(() => {
    if (state.filterTypes.length > 0) {
      // 重置到第一页
      setPage(1);
      // 使用防抖函数
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current(1, pageSize);
      } else {
        // 如果防抖函数还未初始化，直接执行
        performSearch(1, pageSize);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedFilters, pageSize]);

  // 页码变化时重新搜索
  useEffect(() => {
    if (state.filterTypes.length > 0) {
      performSearch(page, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 更新筛选条件
  const updateFilter = useCallback(
    (filterType: keyof SelectedFilters, filterId: number, checked: boolean) => {
      setState(prev => {
        const newSelected = { ...prev.selectedFilters };
        const currentIds = newSelected[filterType];

        if (checked) {
          if (!currentIds.includes(filterId)) {
            newSelected[filterType] = [...currentIds, filterId];
          }
        } else {
          newSelected[filterType] = currentIds.filter(id => id !== filterId);
        }

        return {
          ...prev,
          selectedFilters: newSelected,
        };
      });
    },
    []
  );

  // 清除所有筛选条件
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedFilters: initialSelectedFilters,
    }));
    setPage(1);
  }, []);

  // 获取特定类型的可用筛选选项
  const getAvailableFilters = useCallback(
    (type: keyof Facets): Facets[keyof Facets] => {
      return state.facets?.[type] || [];
    },
    [state.facets]
  );

  return {
    // 数据
    recipes: state.recipes,
    filterTypes: state.filterTypes,
    facets: state.facets,
    pagination: state.pagination,
    selectedFilters: state.selectedFilters,
    loading: state.loading,
    error: state.error,

    // 操作方法
    updateFilter,
    clearFilters,
    getAvailableFilters,
    setPage,
    setPageSize,

    // 当前状态
    page,
    pageSize,
  };
}
