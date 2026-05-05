import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/core/api/route-helpers';
import { fetchRecipeKeywordSearchStrapi } from '@/features/recipe/recipes.api';
import { parseRecipeKeywordSearchParams } from '@/features/recipe/recipes-search-params';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const parsed = parseRecipeKeywordSearchParams(request.nextUrl.searchParams);
  if (!parsed.q) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 });
  }

  try {
    const result = await fetchRecipeKeywordSearchStrapi({
      q: parsed.q,
      page: parsed.page,
      pageSize: parsed.pageSize,
      tags: parsed.tags,
      difficulty: parsed.difficulty,
      cookTimeGte: parsed.cookTimeGte,
      cookTimeLte: parsed.cookTimeLte,
      ratingGte: parsed.ratingGte,
      sort: parsed.sort,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
