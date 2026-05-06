import { NextResponse } from 'next/server';
import {
  searchCartProductBySkuFromMeilisearch,
  searchCartProductsBySkusFromMeilisearch,
} from '@/features/product';

function normalizeCartSku(sku: string): string {
  const commaIdx = sku.indexOf(',');
  return commaIdx > 0 ? sku.slice(0, commaIdx).trim() : sku.trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSku = searchParams.get('sku');
  const rawSkus = searchParams.get('skus');

  // Batch mode: ?skus=SKU1,SKU2,SKU3
  if (rawSkus) {
    const skus = rawSkus
      .split(',')
      .map(s => normalizeCartSku(s))
      .filter(Boolean);

    if (skus.length === 0) {
      return NextResponse.json(
        { success: false, data: null, error: 'Missing skus' },
        { status: 400 }
      );
    }

    try {
      const results = await searchCartProductsBySkusFromMeilisearch(skus);
      return NextResponse.json({ success: true, data: results, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { success: false, data: null, error: message },
        { status: 500 }
      );
    }
  }

  // Single mode: ?sku=XXX (backward compatible)
  if (!rawSku) {
    return NextResponse.json(
      { success: false, data: null, error: 'Missing sku or skus' },
      { status: 400 }
    );
  }

  const normalizedSku = normalizeCartSku(rawSku);

  try {
    const enrichment = await searchCartProductBySkuFromMeilisearch(
      normalizedSku
    );
    if (!enrichment) {
      return NextResponse.json(
        { success: false, data: null, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: enrichment,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
