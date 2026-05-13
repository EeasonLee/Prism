import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import { resolveCategoryBySlug } from '@/features/category';
import { productQueryFacade } from '@/features/product';
import type { UnifiedProductSortOption } from '@/features/product';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sp = request.nextUrl.searchParams;

  const brand = sp.get('brand')?.trim() || undefined;
  const size = sp.get('size')?.trim() || undefined;
  const stockStatus = sp.get('stock_status')?.trim() || undefined;
  const priceMin = sp.get('price_min');
  const priceMax = sp.get('price_max');
  const sort = (sp.get('sort') as UnifiedProductSortOption) || undefined;
  const page = Math.max(1, Number(sp.get('page') ?? '1'));
  const pageSize = Math.min(
    48,
    Math.max(1, Number(sp.get('pageSize') ?? '24'))
  );

  try {
    const category = await resolveCategoryBySlug(slug).catch(() => null);
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { message: 'Category not found', code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    const hasMagentoCategoryId =
      typeof category.magentoCategoryId === 'number' &&
      category.magentoCategoryId > 0;

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

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    return handleApiError(error);
  }
}
