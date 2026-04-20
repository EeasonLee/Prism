import { NextResponse } from 'next/server';
import {
  searchProducts,
  type ShopSortOption,
} from '../../shop/lib/meilisearch';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get('q') ?? undefined;
  const category = searchParams.get('category') ?? undefined;
  const brand = searchParams.get('brand') ?? undefined;
  const size = searchParams.get('size') ?? undefined;
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  const sort = (searchParams.get('sort') as ShopSortOption) || undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(
    48,
    Math.max(1, Number(searchParams.get('pageSize') ?? '24'))
  );

  try {
    // 通用搜索：走原有路径（含 Magento REST 降级）
    const result = await searchProducts({
      q: q?.trim(),
      category,
      brand,
      size,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      sort,
      page,
      pageSize,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
