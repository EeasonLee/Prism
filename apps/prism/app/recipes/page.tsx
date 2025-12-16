import { getFilterTypes, searchRecipes } from '../../lib/api/recipes';
import { RecipesClient } from './RecipesClient';
import type { SelectedFilters } from './types';

export const revalidate = 60;

type RecipesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_PAGE_SIZE = 12;

function parseNumber(value: string | string[] | undefined, fallback: number) {
  if (Array.isArray(value)) {
    const first = Number(value[0]);
    return Number.isFinite(first) ? first : fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNumberArray(
  value: string | string[] | undefined
): number[] | undefined {
  if (!value) return undefined;

  const values = Array.isArray(value) ? value : value.split(',');
  const parsed = values
    .map(v => Number(v))
    .filter(num => Number.isFinite(num) && num > 0);

  return parsed.length > 0 ? parsed : undefined;
}

function buildSelectedFilters(
  searchParams: Record<string, string | string[] | undefined>
): SelectedFilters {
  const categoryIdValue = searchParams.categoryId;
  const categoryId =
    categoryIdValue !== undefined ? parseNumber(categoryIdValue, 0) : undefined;

  return {
    recipeTypes: parseNumberArray(searchParams.recipeTypes) ?? [],
    ingredients: parseNumberArray(searchParams.ingredients) ?? [],
    cuisines: parseNumberArray(searchParams.cuisines) ?? [],
    dishTypes: parseNumberArray(searchParams.dishTypes) ?? [],
    specialDiets: parseNumberArray(searchParams.specialDiets) ?? [],
    holidaysEvents: parseNumberArray(searchParams.holidaysEvents) ?? [],
    productTypes: parseNumberArray(searchParams.productTypes) ?? [],
    categoryId: categoryId && categoryId > 0 ? categoryId : undefined,
  };
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  // Next.js 15: searchParams 现在是 Promise，需要先 await
  const resolvedSearchParams = await searchParams;

  const page = Math.max(1, parseNumber(resolvedSearchParams.page, 1));
  const pageSize = Math.max(
    1,
    parseNumber(resolvedSearchParams.pageSize, DEFAULT_PAGE_SIZE)
  );
  const selectedFilters = buildSelectedFilters(resolvedSearchParams);

  const [filterTypesResponse, recipesResponse] = await Promise.all([
    getFilterTypes(),
    searchRecipes({
      page,
      pageSize,
      includeFacets: true,
      ...selectedFilters,
    }),
  ]);

  return (
    <RecipesClient
      recipes={recipesResponse.data}
      facets={recipesResponse.meta.facets || null}
      pagination={recipesResponse.meta.pagination}
      filterTypes={filterTypesResponse.data}
      selectedFilters={selectedFilters}
      page={page}
      pageSize={pageSize}
    />
  );
}
