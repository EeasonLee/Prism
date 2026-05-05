import { NextResponse } from 'next/server';
import type { ShopSortOption } from '@/features/search/shop-search';
import { resolveCategoryBySlug } from '@/features/category/list.bff';
import { productQueryFacade } from '@/features/product/query-facade';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);

  const brand = searchParams.get('brand') ?? undefined;
  const size = searchParams.get('size') ?? undefined;
  const stockStatus = searchParams.get('stock_status') ?? undefined;
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  const sort = (searchParams.get('sort') as ShopSortOption) || undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(
    48,
    Math.max(1, Number(searchParams.get('pageSize') ?? '24'))
  );

  try {
    // 解析分类
    const category = await resolveCategoryBySlug(slug).catch(() => null);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const hasMagentoCategoryId =
      typeof category.magentoCategoryId === 'number' &&
      category.magentoCategoryId > 0;

    // 搜索产品（仅走 Meilisearch）
    const result = await productQueryFacade.queryProducts({
      ...(hasMagentoCategoryId
        ? { magentoCategoryId: category.magentoCategoryId }
        : { strapiCategorySlug: category.slug }),
      page,
      pageSize,
      sort,
      filters: {
        brand,
        size,
        stockStatus,
        priceMin: priceMin ? Number(priceMin) : undefined,
        priceMax: priceMax ? Number(priceMax) : undefined,
      },
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
