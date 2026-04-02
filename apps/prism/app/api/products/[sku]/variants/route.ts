import { NextResponse } from 'next/server';
import { fetchProductDetailBySkuGQL } from '@/lib/services/magento/product.service';
import { mapProductVariants } from '@/lib/mappers/product.mapper';

export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;

  try {
    const raw = await fetchProductDetailBySkuGQL(sku);
    const data = mapProductVariants(raw);

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    const isNotFound =
      error instanceof Error && error.message.includes('not found');

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: isNotFound ? 'PRODUCT_NOT_FOUND' : 'VARIANTS_FETCH_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch variants',
        },
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
