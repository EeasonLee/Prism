import Image from 'next/image';
import Link from 'next/link';
import { FiltersPanel } from './components/FiltersPanel';
import { RecipeGrid } from './components/RecipeGrid';
import { RecipeHeader } from './components/RecipeHeader';
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

function buildBaseSearchParams(
  selectedFilters: SelectedFilters,
  pageSize: number
) {
  const params = new URLSearchParams();
  params.set('pageSize', String(pageSize));

  const filterEntries: Array<[keyof SelectedFilters, number[]]> = [
    ['recipeTypes', selectedFilters.recipeTypes],
    ['ingredients', selectedFilters.ingredients],
    ['cuisines', selectedFilters.cuisines],
    ['dishTypes', selectedFilters.dishTypes],
    ['specialDiets', selectedFilters.specialDiets],
    ['holidaysEvents', selectedFilters.holidaysEvents],
    ['productTypes', selectedFilters.productTypes],
  ];

  filterEntries.forEach(([key, values]) => {
    values.forEach(value => {
      params.append(key, String(value));
    });
  });

  // Handle categoryId separately as it's a single number, not an array
  if (selectedFilters.categoryId) {
    params.set('categoryId', String(selectedFilters.categoryId));
  }

  return params;
}

export function RecipesClient({
  recipes,
  facets,
  pagination,
  filterTypes,
  selectedFilters,
  page,
  pageSize,
}: RecipesClientProps) {
  const baseParams = buildBaseSearchParams(selectedFilters, pageSize);

  const createPageHref = (targetPage: number) => {
    const params = new URLSearchParams(baseParams);
    params.set('page', String(targetPage));
    return `/recipes?${params.toString()}`;
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
              Cuisinart® appliances and cookware.
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
              selectedFilters={selectedFilters}
              pageSize={pageSize}
            />
          </aside>

          <main className="min-w-0 flex-1">
            <RecipeHeader
              totalRecipes={pagination?.total ?? 0}
              showingRecipes={recipes.length}
              pageSize={pageSize}
              selectedFilters={selectedFilters}
            />
            {recipes.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-600">No recipes found</p>
              </div>
            ) : (
              <>
                <RecipeGrid recipes={recipes} />
                {pagination && pagination.pageCount > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {page > 1 ? (
                      <Link
                        href={createPageHref(page - 1)}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Previous
                      </Link>
                    ) : (
                      <span className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400">
                        Previous
                      </span>
                    )}
                    <span className="px-4 text-sm text-gray-700">
                      Page {pagination.page} of {pagination.pageCount}
                    </span>
                    {page < pagination.pageCount ? (
                      <Link
                        href={createPageHref(page + 1)}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Next
                      </Link>
                    ) : (
                      <span className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400">
                        Next
                      </span>
                    )}
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
