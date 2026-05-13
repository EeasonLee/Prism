import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import {
  fetchRecipeFacetedSearchStrapi,
  fetchRecipeKeywordSearchStrapi,
  parseRecipeSearchParams,
  parseRecipeKeywordSearchParams,
} from '@/features/recipe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  // Keyword search when `q` is present
  if (sp.get('q')?.trim()) {
    const parsed = parseRecipeKeywordSearchParams(sp);
    if (!parsed.q) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { message: 'q is required', code: 'BAD_REQUEST' },
        },
        { status: 400 }
      );
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
      return NextResponse.json({ success: true, data: result, error: null });
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Faceted search (default)
  try {
    const params = parseRecipeSearchParams(sp);
    const result = await fetchRecipeFacetedSearchStrapi(params);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    return handleApiError(error);
  }
}
