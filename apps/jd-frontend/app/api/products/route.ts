import { NextResponse } from 'next/server';
import { getProductListBFF } from '@/lib/api/bff/product/list';

// Numeric literal required by Next.js; sync with REVALIDATE_SECONDS_CATALOG_SNAPSHOT in cache-policy.ts
export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;
  const sort = searchParams.get('sort') as 'name' | 'price' | null;

  try {
    const mapped = await getProductListBFF({
      categoryId: categoryId ? Number(categoryId) : undefined,
      page,
      limit,
      sort: sort || undefined,
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
