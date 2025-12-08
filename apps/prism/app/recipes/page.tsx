'use client';

import { FiltersPanel } from './components/FiltersPanel';
import { RecipeGrid } from './components/RecipeGrid';
import { RecipeHeader } from './components/RecipeHeader';
import { useRecipes } from './hooks/useRecipes';

export default function RecipesPage() {
  const {
    recipes,
    filterTypes,
    facets,
    pagination,
    selectedFilters,
    loading,
    error,
    updateFilter,
    setPage,
    setPageSize,
    page,
    pageSize,
  } = useRecipes(12);

  // Map filterTypes to filter type keys
  const filterTypeMap: Record<string, keyof typeof selectedFilters> = {
    'recipe-type': 'recipeTypes',
    'main-ingredients': 'ingredients',
    cuisine: 'cuisines',
    'dish-type': 'dishTypes',
    'special-diets': 'specialDiets',
    'holidays-events': 'holidaysEvents',
    'product-type': 'productTypes',
  };

  const handleFilterChange = (
    filterType: string,
    filterId: number,
    checked: boolean
  ) => {
    const key = filterTypeMap[filterType] as keyof typeof selectedFilters;
    if (key) {
      updateFilter(key, filterId, checked);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="rounded-lg bg-red-50 p-4">
            <h3 className="text-lg font-semibold text-red-800">
              Failed to Load
            </h3>
            <p className="mt-2 text-sm text-red-600">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left filter panel */}
          <aside className="w-full lg:w-64 lg:flex-shrink-0">
            <FiltersPanel
              filterTypes={filterTypes}
              facets={facets}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              loading={loading}
            />
          </aside>

          {/* Right content area */}
          <main className="flex-1 min-w-0">
            <RecipeHeader
              totalRecipes={pagination?.total ?? 0}
              showingRecipes={recipes.length}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-300 border-r-gray-600"></div>
                  <p className="mt-4 text-sm text-gray-600">Loading...</p>
                </div>
              </div>
            ) : recipes.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-600">No recipes found</p>
              </div>
            ) : (
              <>
                <RecipeGrid recipes={recipes} />
                {/* Pagination controls */}
                {pagination && pagination.pageCount > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 text-sm text-gray-700">
                      Page {pagination.page} of {pagination.pageCount}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.pageCount}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
