import type { SelectedFilters } from '../types';

interface RecipeHeaderProps {
  totalRecipes: number;
  showingRecipes: number;
  pageSize: number;
  selectedFilters: SelectedFilters;
}

const pageSizeOptions = [12, 24, 48];

function HiddenFilterFields({
  selectedFilters,
}: {
  selectedFilters: SelectedFilters;
}) {
  const entries: Array<[keyof SelectedFilters, number[]]> = [
    ['recipeTypes', selectedFilters.recipeTypes],
    ['ingredients', selectedFilters.ingredients],
    ['cuisines', selectedFilters.cuisines],
    ['dishTypes', selectedFilters.dishTypes],
    ['specialDiets', selectedFilters.specialDiets],
    ['holidaysEvents', selectedFilters.holidaysEvents],
    ['productTypes', selectedFilters.productTypes],
  ];

  return (
    <>
      {entries.map(([key, values]) =>
        values.map(value => (
          <input
            key={`${key}-${value}`}
            type="hidden"
            name={key}
            value={value}
          />
        ))
      )}
    </>
  );
}

export function RecipeHeader({
  totalRecipes,
  showingRecipes,
  pageSize,
  selectedFilters,
}: RecipeHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="mb-3 text-4xl font-bold text-gray-900">
        {totalRecipes.toLocaleString()} Recipes
      </h1>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing {showingRecipes} of {totalRecipes.toLocaleString()} recipes
        </p>
        <form method="get" className="flex items-center gap-3">
          <HiddenFilterFields selectedFilters={selectedFilters} />
          <input type="hidden" name="page" value="1" />
          <select
            name="pageSize"
            defaultValue={pageSize}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                Showing {option} Recipes
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            更新
          </button>
        </form>
      </div>
    </div>
  );
}
