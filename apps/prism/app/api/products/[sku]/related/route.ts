import { NextResponse } from 'next/server';
import { fetchProductDetailBySkuGQL } from '@/lib/services/magento/product.service';
import { fetchRelatedBySlug } from '@/lib/services/search/meilisearch.service';
import type { RelatedProductItem } from '@/lib/services/search/meilisearch.service';

export const revalidate = 120;

/** 从 Magento variants fallback */
async function fetchRelatedFromMagento(
  sku: string
): Promise<RelatedProductItem[]> {
  try {
    const raw = await fetchProductDetailBySkuGQL(sku);
    const variants = raw.variants ?? [];
    return variants.slice(0, 8).map(v => ({
      sku: v.product.sku,
      name: v.product.name,
      price: v.product.price_range.minimum_price.final_price.value,
      image: v.product.media_gallery?.[0]?.url ?? '',
      inStock: v.product.stock_status === 'IN_STOCK',
    }));
  } catch {
    return [];
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;

  try {
    const raw = await fetchProductDetailBySkuGQL(sku);
    const firstCategory = raw.categories?.[0];

    let items: RelatedProductItem[] = [];

    if (firstCategory) {
      const categorySlug = firstCategory.name
        .toLowerCase()
        .replace(/\s+/g, '-');

      try {
        items = await fetchRelatedBySlug(categorySlug, sku);
      } catch {
        items = await fetchRelatedFromMagento(sku);
      }
    } else {
      items = await fetchRelatedFromMagento(sku);
    }

    return NextResponse.json({ success: true, data: { items }, error: null });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'RELATED_FETCH_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch related products',
        },
      },
      { status: 500 }
    );
  }
}
