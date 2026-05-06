import type { RecipeSearchParams } from '../types';

function parseCommaSeparatedPositiveInts(
  sp: URLSearchParams,
  key: string
): number[] | undefined {
  const raw = sp.get(key);
  if (!raw?.trim()) return undefined;
  const nums = raw
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isFinite(n) && n > 0);
  return nums.length > 0 ? nums : undefined;
}

function parsePositiveInt(
  sp: URLSearchParams,
  key: string
): number | undefined {
  const raw = sp.get(key);
  if (raw === null || raw === '') return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * 与 `buildQueryString` + `RecipeSearchParams` 约定一致（数组为逗号分隔单键）。
 */
export function parseRecipeSearchParams(
  sp: URLSearchParams
): RecipeSearchParams {
  const page = parsePositiveInt(sp, 'page');
  const pageSize = parsePositiveInt(sp, 'pageSize');
  const includeFacetsRaw = sp.get('includeFacets');
  const includeFacets =
    includeFacetsRaw === null ? undefined : includeFacetsRaw === 'true';

  const categoryId = parsePositiveInt(sp, 'categoryId');

  return {
    page,
    pageSize,
    includeFacets,
    recipeTypes: parseCommaSeparatedPositiveInts(sp, 'recipeTypes'),
    ingredients: parseCommaSeparatedPositiveInts(sp, 'ingredients'),
    cuisines: parseCommaSeparatedPositiveInts(sp, 'cuisines'),
    dishTypes: parseCommaSeparatedPositiveInts(sp, 'dishTypes'),
    specialDiets: parseCommaSeparatedPositiveInts(sp, 'specialDiets'),
    holidaysEvents: parseCommaSeparatedPositiveInts(sp, 'holidaysEvents'),
    productTypes: parseCommaSeparatedPositiveInts(sp, 'productTypes'),
    categoryId,
  };
}

export interface RecipeKeywordSearchParsed {
  q: string;
  page?: number;
  pageSize?: number;
  tags?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  cookTimeGte?: number;
  cookTimeLte?: number;
  ratingGte?: number;
  sort?: string;
}

/**
 * 与 `searchRecipesByKeyword` 发往 Strapi 的 query 一致。
 */
export function parseRecipeKeywordSearchParams(
  sp: URLSearchParams
): RecipeKeywordSearchParsed {
  const q = sp.get('q')?.trim() ?? '';
  const page = parsePositiveInt(sp, 'page');
  const pageSize = parsePositiveInt(sp, 'pageSize');
  const tags = sp.get('tags')?.trim();
  const difficultyRaw = sp.get('difficulty');
  const difficulty =
    difficultyRaw === 'easy' ||
    difficultyRaw === 'medium' ||
    difficultyRaw === 'hard'
      ? difficultyRaw
      : undefined;

  const cookTimeGte = sp.has('cookTimeGte')
    ? Number(sp.get('cookTimeGte'))
    : undefined;
  const cookTimeLte = sp.has('cookTimeLte')
    ? Number(sp.get('cookTimeLte'))
    : undefined;
  const ratingGte = sp.has('ratingGte')
    ? Number(sp.get('ratingGte'))
    : undefined;
  const sort = sp.get('sort')?.trim();

  return {
    q,
    page,
    pageSize,
    tags: tags && tags.length > 0 ? tags : undefined,
    difficulty,
    cookTimeGte:
      cookTimeGte !== undefined && Number.isFinite(cookTimeGte)
        ? cookTimeGte
        : undefined,
    cookTimeLte:
      cookTimeLte !== undefined && Number.isFinite(cookTimeLte)
        ? cookTimeLte
        : undefined,
    ratingGte:
      ratingGte !== undefined && Number.isFinite(ratingGte)
        ? ratingGte
        : undefined,
    sort: sort && sort.length > 0 ? sort : undefined,
  };
}
