import { NextResponse } from 'next/server';
import { fetchProductDetailBySkuGQL } from '@/lib/services/magento/product.service';

// 不缓存，每次实时获取
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;

  try {
    const raw = await fetchProductDetailBySkuGQL(sku);
    const inStock = raw.stock_status === 'IN_STOCK';

    return NextResponse.json(
      {
        success: true,
        data: {
          sku: raw.sku,
          inStock,
          stockStatus: raw.stock_status,
          qty: null,
          isLowStock: false,
        },
        error: null,
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    const isNotFound =
      error instanceof Error && error.message.includes('not found');

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: isNotFound ? 'PRODUCT_NOT_FOUND' : 'STOCK_FETCH_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch stock',
        },
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
