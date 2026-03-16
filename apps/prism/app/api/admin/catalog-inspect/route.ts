/**
 * 商品数据结构分析接口（开发/运维工具）
 *
 * 用途：拉取真实 Magento 商品样本，分析字段分布，辅助设计 Strapi product-enrichment Content Type。
 *
 * 安全：需要 ADMIN_SECRET 请求头或查询参数认证，不对公众开放。
 *
 * 调用示例：
 *   GET /api/admin/catalog-inspect?secret=xxx&categoryId=2&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchProducts } from '../../../../lib/api/magento/catalog';
import type { MagentoProduct } from '../../../../lib/api/magento/types';

const adminSecret = process.env.ADMIN_SECRET ?? process.env.REVALIDATE_SECRET;

// ─── 分析工具函数 ─────────────────────────────────────────────────────────────

function analyzeField(values: unknown[]): {
  type: string;
  nonNullCount: number;
  total: number;
  fillRate: string;
  sample: unknown[];
} {
  const nonNull = values.filter(v => v != null && v !== '' && v !== false);
  const types = [...new Set(values.map(v => typeof v))].join(' | ');
  return {
    type: types,
    nonNullCount: nonNull.length,
    total: values.length,
    fillRate: `${Math.round((nonNull.length / values.length) * 100)}%`,
    sample: nonNull.slice(0, 2),
  };
}

function analyzeProducts(products: MagentoProduct[]) {
  if (products.length === 0) return null;

  const fields: Record<string, ReturnType<typeof analyzeField>> = {
    name: analyzeField(products.map(p => p.name)),
    sku: analyzeField(products.map(p => p.sku)),
    price: analyzeField(products.map(p => p.price)),
    special_price: analyzeField(products.map(p => p.special_price)),
    type_id: analyzeField(products.map(p => p.type_id)),
    status: analyzeField(products.map(p => p.status)),
    thumbnail_url: analyzeField(products.map(p => p.thumbnail_url)),
    image_url: analyzeField(products.map(p => p.image_url)),
    short_description: analyzeField(products.map(p => p.short_description)),
    description: analyzeField(products.map(p => p.description)),
    url_key: analyzeField(products.map(p => p.url_key)),
    media_gallery_count: analyzeField(
      products.map(p => p.media_gallery?.length ?? 0)
    ),
    configurable_options_count: analyzeField(
      products.map(p => p.configurable_options?.length ?? 0)
    ),
    rating: analyzeField(products.map(p => p.rating)),
    review_count: analyzeField(products.map(p => p.review_count)),
    is_in_stock: analyzeField(products.map(p => p.is_in_stock)),
    stock_qty: analyzeField(products.map(p => p.stock_qty)),
    category_ids_count: analyzeField(
      products.map(p => p.category_ids?.length ?? 0)
    ),
  };

  // 统计商品类型分布
  const typeDistribution: Record<string, number> = {};
  for (const p of products) {
    typeDistribution[p.type_id] = (typeDistribution[p.type_id] ?? 0) + 1;
  }

  // 分析 description 内容类型（纯文本 / HTML）
  const descSamples = products
    .filter(p => p.description)
    .slice(0, 3)
    .map(p => ({
      sku: p.sku,
      isHtml: p.description?.includes('<') ?? false,
      length: p.description?.length ?? 0,
      preview: p.description?.slice(0, 200),
    }));

  // 分析图片数量分布
  const imageCountDist: Record<number, number> = {};
  for (const p of products) {
    const count = p.media_gallery?.length ?? 0;
    imageCountDist[count] = (imageCountDist[count] ?? 0) + 1;
  }

  // 分析 extra_attributes（自定义属性）
  const allAttributeCodes = new Set<string>();
  for (const p of products) {
    if (p.extra_attributes) {
      for (const code of Object.keys(p.extra_attributes)) {
        allAttributeCodes.add(code);
      }
    }
    if (p.custom_attributes) {
      for (const attr of p.custom_attributes) {
        allAttributeCodes.add(attr.attribute_code);
      }
    }
  }

  return {
    sampleCount: products.length,
    typeDistribution,
    fields,
    imageCountDistribution: imageCountDist,
    descriptionSamples: descSamples,
    customAttributeCodes: [...allAttributeCodes],
    // 推荐 Strapi 字段列表（基于填充率分析）
    strapiFieldRecommendations: {
      highPriority: [
        'sku (unique key, required)',
        'display_name (覆盖 Magento name，用于本地化/营销优化)',
        'images (media[] 多图，覆盖 Magento media_gallery)',
        'thumbnail (media 单图，主缩略图)',
        'short_description_html (richtext，覆盖 Magento short_description)',
        'description_html (richtext，覆盖 Magento description)',
        'promotion_label (string，营销标签)',
        'is_featured (boolean，精选标记)',
      ],
      mediumPriority: [
        'promotion_expires_at (datetime，促销截止)',
        'seo_title (string，SEO 标题)',
        'seo_description (text，SEO 描述)',
      ],
      notes: [
        '不要在 Strapi 存储价格/库存——这些来自 Magento 实时数据',
        'sku 字段建议设置为 unique 约束，防止重复录入',
        '所有字段均为可选（有则覆盖 Magento，无则 fallback）',
      ],
    },
    rawSample: products.slice(0, 2).map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      type_id: p.type_id,
      price: p.price,
      thumbnail_url: p.thumbnail_url,
      media_gallery_count: p.media_gallery?.length ?? 0,
      has_description: !!p.description,
      has_short_description: !!p.short_description,
      configurable_options: p.configurable_options?.map(o => o.label) ?? [],
      extra_attribute_keys: p.extra_attributes
        ? Object.keys(p.extra_attributes)
        : [],
    })),
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!adminSecret) {
    return NextResponse.json(
      { error: 'ADMIN_SECRET or REVALIDATE_SECRET not configured' },
      { status: 500 }
    );
  }

  const secret =
    request.headers.get('x-admin-secret') ??
    request.nextUrl.searchParams.get('secret');

  if (secret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categoryId = Number(
    request.nextUrl.searchParams.get('categoryId') ?? '2'
  );
  const limit = Math.min(
    50,
    Number(request.nextUrl.searchParams.get('limit') ?? '20')
  );

  try {
    const productList = await fetchProducts({
      categoryId,
      pageSize: limit,
      sort: 'created_at',
      order: 'desc',
    });

    const analysis = analyzeProducts(productList.items);

    return NextResponse.json({
      meta: {
        totalProductsInCategory: productList.total_count,
        analyzedCount: productList.items.length,
        categoryId,
      },
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}

export const runtime = 'nodejs';
