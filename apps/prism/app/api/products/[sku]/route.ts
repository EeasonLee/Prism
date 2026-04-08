import { NextResponse } from 'next/server';
import { REVALIDATE_SECONDS_PRODUCT_DETAIL } from '@/lib/api/cache-policy';
import { fetchProductDetailBySkuGQL } from '@/lib/services/magento/product.service';
import { mapProductDetail } from '@/lib/mappers/product.mapper';

export const revalidate = REVALIDATE_SECONDS_PRODUCT_DETAIL;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;

  try {
    const raw = await fetchProductDetailBySkuGQL(sku);
    const data = mapProductDetail(raw);

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    const isNotFound =
      error instanceof Error && error.message.includes('not found');

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: isNotFound ? 'PRODUCT_NOT_FOUND' : 'PRODUCT_FETCH_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch product',
        },
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
