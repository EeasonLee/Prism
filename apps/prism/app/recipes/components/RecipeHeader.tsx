'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import type { SelectedFilters } from '../types';

interface RecipeHeaderProps {
  totalRecipes: number;
  showingRecipes: number;
  pageSize: number;
  selectedFilters: SelectedFilters;
  onPageSizeChange: (
    filters: SelectedFilters,
    page: number,
    pageSize: number
  ) => Promise<void>;
  onSearch: (
    filters: SelectedFilters,
    page: number,
    pageSize: number,
    searchQuery: string
  ) => Promise<void>;
}

const pageSizeOptions = [12, 24, 48];

export function RecipeHeader({
  totalRecipes,
  showingRecipes,
  pageSize,
  selectedFilters,
  onPageSizeChange,
  onSearch,
}: RecipeHeaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [searchText, setSearchText] = useState(
    selectedFilters.searchQuery || ''
  );

  const handleSelectChange = async (value: string) => {
    const newPageSize = Number(value);
    setCurrentPageSize(newPageSize);
    setIsLoading(true);
    try {
      await onPageSizeChange(selectedFilters, 1, newPageSize);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await onSearch(
        { ...selectedFilters, searchQuery: searchText },
        1,
        currentPageSize,
        searchText
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            {totalRecipes.toLocaleString()} Recipes
          </h1>
          <p className="text-sm text-gray-600">
            Showing {showingRecipes} of {totalRecipes.toLocaleString()} recipes
          </p>
        </div>
        <form
          className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"
          onSubmit={handleSearchSubmit}
        >
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
              onChange={e => setSearchText(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={String(currentPageSize)}
              onValueChange={handleSelectChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select page size" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(option => (
                  <SelectItem key={option} value={String(option)}>
                    Showing {option} Recipes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
              disabled={isLoading}
            >
              Search
            </button>
            {isLoading && (
              <span className="text-sm text-gray-500">加载中...</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
