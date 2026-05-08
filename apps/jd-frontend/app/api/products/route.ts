import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import {
  productQueryFacade,
  parseProductQueryParams,
  searchCartProductBySkuFromMeilisearch,
  searchCartProductsBySkusFromMeilisearch,
} from '@/features/product';

function normalizeCartSku(sku: string): string {
  const commaIdx = sku.indexOf(',');
  return commaIdx > 0 ? sku.slice(0, commaIdx).trim() : sku.trim();
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawSku = sp.get('sku');
  const rawSkus = sp.get('skus');

  // ――― Cart enrichment (backward-compatible) ―――――――――――――――――――――――――
  if (rawSkus) {
    const skus = rawSkus
      .split(',')
      .map(s => normalizeCartSku(s))
      .filter(Boolean);

    if (skus.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { message: 'Missing skus', code: 'BAD_REQUEST' },
        },
        { status: 400 }
      );
    }

    try {
      const results = await searchCartProductsBySkusFromMeilisearch(skus);
      return NextResponse.json({ success: true, data: results, error: null });
    } catch (error) {
      return handleApiError(error);
    }
  }

  if (rawSku) {
    const normalizedSku = normalizeCartSku(rawSku);

    try {
      const enrichment = await searchCartProductBySkuFromMeilisearch(
        normalizedSku
      );
      if (!enrichment) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: { message: 'Product not found', code: 'NOT_FOUND' },
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: enrichment,
        error: null,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }

  // ――― Unified product query ―――――――――――――――――――――――――――――――――――――――
  try {
    const params = parseProductQueryParams(sp);

    // Require at least one meaningful param for listing queries
    if (
      !params.q &&
      params.magentoCategoryId === undefined &&
      params.strapiCategoryId === undefined &&
      !params.strapiCategorySlug
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            message:
              'At least one query parameter is required (q, magentoCategoryId, strapiCategoryId, strapiCategorySlug, sku, or skus)',
            code: 'BAD_REQUEST',
          },
        },
        { status: 400 }
      );
    }

    const result = await productQueryFacade.queryProducts(params);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    return handleApiError(error);
  }
}
