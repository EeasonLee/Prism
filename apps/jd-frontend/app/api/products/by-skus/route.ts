import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import { productQueryFacade } from '@/features/product';

/**
 * POST /api/products/by-skus
 *
 * 批量按 SKU 查询商品卡片数据。服务端代理 Meilisearch，避免客户端直连。
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { skus?: string[] };
    const skus = body.skus;

    if (!Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            message: 'skus is required (non-empty array)',
            code: 'BAD_REQUEST',
          },
        },
        { status: 400 }
      );
    }

    const products = await productQueryFacade.queryBySkus(skus);
    return NextResponse.json({ success: true, data: products, error: null });
  } catch (error) {
    return handleApiError(error);
  }
}
