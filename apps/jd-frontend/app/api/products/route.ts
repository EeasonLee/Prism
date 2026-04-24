import { NextResponse } from 'next/server';
import { productQueryFacade } from '@/lib/application/product/product-query-facade';

// Numeric literal required by Next.js; sync with REVALIDATE_SECONDS_CATALOG_SNAPSHOT in cache-policy.ts
export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const strapiCategoryId = searchParams.get('strapiCategoryId');
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;
  const sort = searchParams.get('sort') as 'name' | 'price' | null;
  const sku = searchParams.get('sku');

  try {
    const mapped = await productQueryFacade.queryProducts({
      sku: sku ?? undefined,
      magentoCategoryId: categoryId ? Number(categoryId) : undefined,
      strapiCategoryId: strapiCategoryId ? Number(strapiCategoryId) : undefined,
      page,
      pageSize: limit,
      sort:
        sort === 'price' ? 'price_asc' : sort === 'name' ? 'name' : undefined,
    });

    return NextResponse.json({
      success: true,
      data: mapped,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'PRODUCT_FETCH_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch products',
        },
      },
      { status: 500 }
    );
  }
}
