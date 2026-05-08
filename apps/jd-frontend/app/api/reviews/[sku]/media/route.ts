import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import { fetchReviewMediaBySku } from '@/features/product';

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
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
