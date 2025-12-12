import Link from 'next/link';
import type { Facets, FilterType, SelectedFilters } from '../types';

interface FiltersPanelProps {
  filterTypes: FilterType[];
  facets: Facets | null;
  selectedFilters: SelectedFilters;
  pageSize: number;
}

const filterTypeKeyMap: Record<string, keyof SelectedFilters> = {
  'recipe-type': 'recipeTypes',
  'main-ingredients': 'ingredients',
  cuisine: 'cuisines',
  'dish-type': 'dishTypes',
  'special-diets': 'specialDiets',
  'holidays-events': 'holidaysEvents',
  'product-type': 'productTypes',
};

function getFacetOptions(facets: Facets | null, type: string) {
  if (!facets) return [];
  const facetKey = type as keyof Facets;
  return facets[facetKey] || [];
}

function isOptionChecked(
  selectedFilters: SelectedFilters,
  type: string,
  id: number
) {
  const key = filterTypeKeyMap[type];
  if (!key) return false;
  return selectedFilters[key].includes(id);
}

export function FiltersPanel({
  filterTypes,
  facets,
  selectedFilters,
  pageSize,
}: FiltersPanelProps) {
  return (
    <form className="sticky top-8" method="get">
      <h2 className="mb-8 text-3xl font-bold text-gray-800">Filters</h2>
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="pageSize" value={pageSize} />

      {filterTypes.map((filterType, index) => {
        const options = getFacetOptions(facets, filterType.value);
        const fieldName = filterTypeKeyMap[filterType.value];

        if (!fieldName) {
          return null;
        }

        return (
          <details
            key={filterType.value}
            className="mb-6 rounded-md border border-gray-200 bg-white p-4"
            open={index === 0}
          >
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-gray-900">
              <span>{filterType.label || filterType.labelZh}</span>
              <span className="text-gray-400">+</span>
            </summary>

            <div className="mt-4 space-y-2">
              {options.length === 0 ? (
                <div className="text-sm text-gray-500">No options</div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
                  {options.map(option => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        name={fieldName}
                        value={option.id}
                        defaultChecked={isOptionChecked(
                          selectedFilters,
                          filterType.value,
                          option.id
                        )}
                        className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                      />
                      <span className="flex-1 text-sm text-gray-700">
                        {option.name}
                        {option.count !== undefined && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({option.count})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </details>
        );
      })}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          应用筛选
        </button>
        <Link
          href="/recipes"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          清除
        </Link>
      </div>
    </form>
  );
}
