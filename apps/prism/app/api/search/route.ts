import { NextResponse } from 'next/server';
import { fetchProductSearchResult } from '../../search/lib/service';
import type { SearchSortOption, ProductSearchQuery } from '../../search/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query: ProductSearchQuery = {
    q: searchParams.get('q') ?? undefined,
    page: searchParams.has('page')
      ? Math.max(1, Number(searchParams.get('page')))
      : 1,
    pageSize: searchParams.has('pageSize')
      ? Number(searchParams.get('pageSize'))
      : 24,
    brand: searchParams.get('brand') ?? undefined,
    price_min: searchParams.has('price_min')
      ? Number(searchParams.get('price_min'))
      : undefined,
    price_max: searchParams.has('price_max')
      ? Number(searchParams.get('price_max'))
      : undefined,
    sort: (searchParams.get('sort') as SearchSortOption) || undefined,
  };

  try {
    const result = await fetchProductSearchResult(query);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
