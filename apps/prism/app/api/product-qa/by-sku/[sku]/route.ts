import { NextRequest, NextResponse } from 'next/server';
import { fetchProductQaBySku } from '@/lib/api/strapi/product-qa';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sku: string }> }
) {
  const { sku } = await context.params;
  const page = Math.max(
    1,
    Number(request.nextUrl.searchParams.get('page') ?? '1')
  );
  const pageSize = Math.min(
    50,
    Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '10'))
  );

  try {
    const result = await fetchProductQaBySku(
      decodeURIComponent(sku),
      page,
      pageSize
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch product questions';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const runtime = 'nodejs';
