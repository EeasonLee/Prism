import { NextResponse } from 'next/server';
import { searchShopProducts } from '../../shop/lib/meilisearch';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryUrlKey = searchParams.get('categoryUrlKey') ?? undefined;
  const pageSize = Math.min(
    48,
    Math.max(1, Number(searchParams.get('pageSize') ?? '8'))
  );

  if (!categoryUrlKey) {
    return NextResponse.json(
      { success: false, error: 'categoryUrlKey is required' },
      { status: 400 }
    );
  }

  try {
    const result = await searchShopProducts({
      categorySlug: categoryUrlKey,
      page: 1,
      pageSize,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to fetch deal products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
