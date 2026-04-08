import { NextRequest, NextResponse } from 'next/server';
import { fetchRecipeFacetedSearchStrapi } from '@/lib/api/recipes';
import { parseRecipeSearchParams } from '@/lib/api/recipes-search-params';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const params = parseRecipeSearchParams(request.nextUrl.searchParams);
    const result = await fetchRecipeFacetedSearchStrapi(params);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to search recipes';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
