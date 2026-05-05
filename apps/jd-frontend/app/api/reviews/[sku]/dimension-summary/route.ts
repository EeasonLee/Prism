import { NextResponse } from 'next/server';
import { handleApiError } from '@/core/api/route-helpers';
import { fetchReviewDimensionSummaryBySku } from '@/features/product/reviews.api';

export async function GET(
  _request: Request,
  context: { params: Promise<{ sku: string }> }
) {
  const { sku } = await context.params;
  try {
    const items = await fetchReviewDimensionSummaryBySku(
      decodeURIComponent(sku)
    );
    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
