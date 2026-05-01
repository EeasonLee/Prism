import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/core/api/route-helpers';
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
  // productId 可能来自 Magento；读取聚合时以 SKU 为准（避免 Strapi 内部 id 与 Magento id 不一致）
  const productIdForContext = Number(
    request.nextUrl.searchParams.get('productId') ?? '0'
  );

  try {
    const result = await fetchProductQaBySku(
      Number.isFinite(productIdForContext) ? productIdForContext : 0,
      decodeURIComponent(sku),
      page,
      pageSize
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
