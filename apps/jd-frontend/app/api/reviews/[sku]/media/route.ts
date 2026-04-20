import { NextRequest, NextResponse } from 'next/server';
import { fetchReviewMediaBySku } from '../../../../../lib/api/strapi/reviews';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sku: string }> }
) {
  const { sku } = await context.params;
  const typeParam = request.nextUrl.searchParams.get('type');
  const type =
    typeParam === 'image' || typeParam === 'video' ? typeParam : 'all';
  const page = Math.max(
    1,
    Number(request.nextUrl.searchParams.get('page') ?? '1')
  );
  const pageSize = Math.min(
    100,
    Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '24'))
  );

  try {
    const media = await fetchReviewMediaBySku(
      decodeURIComponent(sku),
      type,
      page,
      pageSize
    );
    return NextResponse.json(media);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch review media';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const runtime = 'nodejs';
