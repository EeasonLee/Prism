import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import { fetchRecipeFacetedSearchStrapi } from '@/features/recipe';
import { parseRecipeSearchParams } from '@/features/recipe';

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
