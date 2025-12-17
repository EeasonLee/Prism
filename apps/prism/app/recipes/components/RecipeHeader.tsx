'use client';

import { useEffect, useRef, useState } from 'react';
import type { SelectedFilters } from '../types';

interface RecipeHeaderProps {
  totalRecipes: number;
  showingRecipes: number;
  pageSize: number;
  selectedFilters: SelectedFilters;
  onSearch: (
    filters: SelectedFilters,
    page: number,
    pageSize: number,
    searchQuery: string
  ) => Promise<void>;
}

// 格式化数字，使用固定 locale 避免 hydration 不匹配
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function RecipeHeader({
  totalRecipes,
  showingRecipes,
  pageSize,
  selectedFilters,
  onSearch,
}: RecipeHeaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  // 使用 ref 跟踪上一次成功提交的搜索查询，避免 useEffect 延迟
  const lastSubmittedQueryRef = useRef<string>(
    (selectedFilters.searchQuery || '').trim()
  );
  const [searchText, setSearchText] = useState(
    selectedFilters.searchQuery || ''
  );

  // 当外部搜索查询变化时（比如通过筛选清空搜索），同步更新
  useEffect(() => {
    const externalQuery = (selectedFilters.searchQuery || '').trim();
    if (externalQuery !== lastSubmittedQueryRef.current) {
      lastSubmittedQueryRef.current = externalQuery;
      setSearchText(selectedFilters.searchQuery || '');
    }
  }, [selectedFilters.searchQuery]);

  // 检查搜索文本是否有变化（与上次提交的查询比较）
  const currentSearchQuery = searchText.trim();
  const hasChanged = currentSearchQuery !== lastSubmittedQueryRef.current;
  const isSearchDisabled = isLoading || !hasChanged;

  const handleSearchSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (isSearchDisabled) return;

    setIsLoading(true);
    try {
      const trimmedQuery = searchText.trim();
      await onSearch(
        { ...selectedFilters, searchQuery: trimmedQuery },
        1,
        pageSize,
        trimmedQuery
      );
      // 搜索成功后，更新上次提交的查询
      lastSubmittedQueryRef.current = trimmedQuery;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            {formatNumber(totalRecipes)} Recipes
          </h1>
          <p className="text-sm text-gray-600">
            Showing {formatNumber(showingRecipes)} of{' '}
            {formatNumber(totalRecipes)} recipes
          </p>
        </div>
        <form className="flex w-full sm:w-auto" onSubmit={handleSearchSubmit}>
          <div className="flex w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm sm:w-80">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
              />
            </svg>
            <input
              className="w-full border-none text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
              type="search"
              placeholder="Search recipes..."
              value={searchText}
              onChange={(e: any) => setSearchText(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="ml-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSearchDisabled}
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
