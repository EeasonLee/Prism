import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/core/api/route-helpers';
import { fetchRecipeFacetedSearchStrapi } from '@/features/recipe/recipes.api';
import { parseRecipeSearchParams } from '@/features/recipe/recipes-search-params';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const params = parseRecipeSearchParams(request.nextUrl.searchParams);
    const result = await fetchRecipeFacetedSearchStrapi(params);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
