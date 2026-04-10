import { NextResponse } from 'next/server';
import {
  getProductDetailAggregate,
  resolveProductDetailAggregate,
} from '@/lib/api/bff/product/detail';

// Numeric literal required by Next.js; sync with REVALIDATE_SECONDS_PRODUCT_DETAIL in cache-policy.ts
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;

  try {
    const aggregate = await getProductDetailAggregate(sku);
    const data = await resolveProductDetailAggregate(aggregate);

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
