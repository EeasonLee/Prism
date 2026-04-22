import { NextResponse } from 'next/server';
import { fetchReviewDimensionSummaryBySku } from '../../../../../lib/api/strapi/reviews';

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
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch review dimension summary';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const runtime = 'nodejs';
