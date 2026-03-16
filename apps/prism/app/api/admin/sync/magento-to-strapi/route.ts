/**
 * Magento → Strapi 数据同步接口（开发/运维工具）
 *
 * 将 Magento 商品和分类核心字段同步到 Strapi 现有 Collection 中，
 * 方便在 Strapi Admin 看到真实数据并决定要维护哪些运营字段。
 *
 * 安全：需要 ADMIN_SECRET（或 REVALIDATE_SECRET）请求头认证。
 *
 * 调用示例：
 *   POST /api/admin/sync/magento-to-strapi
 *   Headers: x-admin-secret: <secret>
 *   Body: { "type": "products", "categoryId": 2, "limit": 20, "page": 1 }
 *
 * 模式说明：
 *   mode=import  首次导入，同步所有字段（含 description）
 *   mode=sync    增量同步，只更新 Magento 来源字段（price/stock/isActive），不覆盖编辑器内容
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchProducts,
  fetchCategoryTree,
} from '../../../../../lib/api/magento/catalog';
import type {
  MagentoProduct,
  MagentoCategoryTree,
} from '../../../../../lib/api/magento/types';
import { apiClient } from '../../../../../lib/api/client';

const adminSecret = process.env.ADMIN_SECRET ?? process.env.REVALIDATE_SECRET;

// ─── Strapi Collection 端点（根据实际 CT 名称调整） ──────────────────────────
//
// 如果调用后报 404，说明端点名不对，常见的变体：
//   'api/products'              → 大多数情况
//   'api/shop-products'         → 如果 CT 起名 shop-product
//   'api/product-items'         → 如果 CT 起名 product-item
//
const STRAPI_PRODUCTS_ENDPOINT = 'api/magento-products';
const STRAPI_CATEGORIES_ENDPOINT = 'api/magento-categories';

// 并发写入数（避免 Strapi 过载）
const WRITE_CONCURRENCY = 5;

// ─── Strapi 响应类型 ──────────────────────────────────────────────────────────

interface StrapiRecord {
  id: number;
  documentId: string;
  sku?: string;
  slug?: string;
  name?: string;
}

interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/** 剥离 HTML 标签，用于将 Magento HTML 描述转为纯文本 shortDescription */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** 生成 URL-safe slug */
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * 将 Magento 商品字段映射到 Strapi product 字段
 *
 * import 模式：同步所有字段，适用于首次导入
 * sync 模式：只同步 Magento 来源字段，不覆盖编辑器已维护的内容字段
 */
function mapProductToStrapi(
  product: MagentoProduct,
  mode: 'import' | 'sync'
): Record<string, unknown> {
  // 这些字段始终跟随 Magento（Strapi 不应覆盖）
  const alwaysSync: Record<string, unknown> = {
    name: product.name,
    sku: product.sku,
    price: product.price > 0 ? product.price : null,
    slug: product.url_key ?? toSlug(product.sku),
    url: product.url_key ? `/${product.url_key}` : null,
    image: product.thumbnail_url ?? null,
    isActive: (product.status ?? 1) === 1,
    stock: product.stock_qty ?? null,
    syncedAt: new Date().toISOString(),
  };

  if (mode === 'import') {
    // 首次导入时补充内容字段（后续 sync 模式不会覆盖这些）
    return {
      ...alwaysSync,
      shortDescription: product.short_description
        ? stripHtml(product.short_description)
        : null,
      description: product.description ?? null,
    };
  }

  return alwaysSync;
}

/**
 * 将 Magento 分类字段映射到 Strapi product-category 字段
 */
function mapCategoryToStrapi(
  category: MagentoCategoryTree
): Record<string, unknown> {
  return {
    name: category.name,
    slug: category.url_key ?? toSlug(category.name),
    isActive: category.is_active,
    level: category.level,
    magentoId: category.id,
    productCount: category.product_count,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * 批量在 Strapi 中查找已存在记录，返回 sku/slug → documentId 映射
 * 每批最多查 25 个（避免 URL 过长）
 */
async function findExistingByField(
  endpoint: string,
  fieldName: 'sku' | 'slug',
  values: string[]
): Promise<Map<string, string>> {
  if (values.length === 0) return new Map();

  const result = new Map<string, string>();
  const BATCH = 25;

  for (let i = 0; i < values.length; i += BATCH) {
    const batch = values.slice(i, i + BATCH);
    const filterParams = batch
      .map(
        (v, idx) =>
          `filters[${fieldName}][$in][${idx}]=${encodeURIComponent(v)}`
      )
      .join('&');

    try {
      const data = await apiClient.get<StrapiListResponse<StrapiRecord>>(
        `${endpoint}?${filterParams}&fields[0]=id&fields[1]=documentId&fields[2]=${fieldName}&pagination[pageSize]=100`
      );
      for (const item of data.data) {
        const key = fieldName === 'sku' ? item.sku : item.slug;
        if (key) result.set(key, item.documentId);
      }
    } catch {
      // 部分批次失败不影响整体，跳过这批
    }
  }

  return result;
}

/** 并发受限执行器：每次执行 concurrency 个任务 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(t => t()));
    results.push(...batchResults);
  }
  return results;
}

// ─── 核心同步逻辑 ─────────────────────────────────────────────────────────────

async function syncProducts(params: {
  categoryId: number;
  limit: number;
  page: number;
  mode: 'import' | 'sync';
  dryRun: boolean;
}) {
  const { categoryId, limit, page, mode, dryRun } = params;

  const productList = await fetchProducts({
    categoryId,
    pageSize: limit,
    page,
    sort: 'created_at',
    order: 'desc',
  });

  const products = productList.items;
  const skus = products.map(p => p.sku);

  const existingMap = dryRun
    ? new Map<string, string>()
    : await findExistingByField(STRAPI_PRODUCTS_ENDPOINT, 'sku', skus);

  const toCreate = products.filter(p => !existingMap.has(p.sku));
  const toUpdate = products.filter(p => existingMap.has(p.sku));

  const report = {
    totalInMagento: productList.total_count,
    totalPages: Math.ceil(productList.total_count / limit),
    currentPage: page,
    fetched: products.length,
    toCreate: toCreate.length,
    toUpdate: toUpdate.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as Array<{ sku: string; action: string; error: string }>,
    skippedSkus: [] as string[],
    dryRun,
    endpoint: STRAPI_PRODUCTS_ENDPOINT,
  };

  if (dryRun) {
    report.skippedSkus = toCreate
      .map(p => p.sku)
      .concat(toUpdate.map(p => p.sku));
    return report;
  }

  // 创建任务
  const createTasks = toCreate.map(product => async () => {
    await apiClient.post(STRAPI_PRODUCTS_ENDPOINT, {
      data: {
        ...mapProductToStrapi(product, mode),
        publishedAt: new Date().toISOString(),
      },
    });
    report.created++;
  });

  // 更新任务
  const updateTasks = toUpdate.map(product => async () => {
    const documentId = existingMap.get(product.sku);
    if (!documentId) return;
    await apiClient.put(`${STRAPI_PRODUCTS_ENDPOINT}/${documentId}`, {
      data: mapProductToStrapi(product, mode),
    });
    report.updated++;
  });

  const allResults = await runWithConcurrency(
    [...createTasks, ...updateTasks],
    WRITE_CONCURRENCY
  );

  // 收集失败信息
  const allProducts = [...toCreate, ...toUpdate];
  for (let i = 0; i < allResults.length; i++) {
    const result = allResults[i];
    if (result.status === 'rejected') {
      report.failed++;
      report.created =
        report.created > 0 && i < toCreate.length
          ? report.created - 1
          : report.created;
      const product = allProducts[i];
      report.errors.push({
        sku: product?.sku ?? 'unknown',
        action: i < toCreate.length ? 'create' : 'update',
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    }
  }

  return report;
}

async function syncCategories(params: { dryRun: boolean }) {
  const { dryRun } = params;

  const tree = await fetchCategoryTree();

  // 展平分类树（跳过根节点 level <= 1）
  function flattenTree(nodes: MagentoCategoryTree[]): MagentoCategoryTree[] {
    const result: MagentoCategoryTree[] = [];
    for (const node of nodes) {
      if (node.level > 1 && node.is_active) {
        result.push(node);
      }
      if (node.children?.length) {
        result.push(...flattenTree(node.children));
      }
    }
    return result;
  }

  const categories = flattenTree(tree.children ?? []);
  const slugs = categories
    .map(c => c.url_key ?? toSlug(c.name))
    .filter(Boolean);

  const existingMap = dryRun
    ? new Map<string, string>()
    : await findExistingByField(STRAPI_CATEGORIES_ENDPOINT, 'slug', slugs);

  const toCreate = categories.filter(
    c => !existingMap.has(c.url_key ?? toSlug(c.name))
  );
  const toUpdate = categories.filter(c =>
    existingMap.has(c.url_key ?? toSlug(c.name))
  );

  const report = {
    fetched: categories.length,
    toCreate: toCreate.length,
    toUpdate: toUpdate.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as Array<{ name: string; error: string }>,
    dryRun,
    endpoint: STRAPI_CATEGORIES_ENDPOINT,
  };

  if (dryRun) return report;

  const createTasks = toCreate.map(category => async () => {
    await apiClient.post(STRAPI_CATEGORIES_ENDPOINT, {
      data: {
        ...mapCategoryToStrapi(category),
        publishedAt: new Date().toISOString(),
      },
    });
    report.created++;
  });

  const updateTasks = toUpdate.map(category => async () => {
    const slug = category.url_key ?? toSlug(category.name);
    const documentId = existingMap.get(slug);
    if (!documentId) return;
    await apiClient.put(`${STRAPI_CATEGORIES_ENDPOINT}/${documentId}`, {
      data: mapCategoryToStrapi(category),
    });
    report.updated++;
  });

  const allResults = await runWithConcurrency(
    [...createTasks, ...updateTasks],
    WRITE_CONCURRENCY
  );

  const allCategories = [...toCreate, ...toUpdate];
  for (let i = 0; i < allResults.length; i++) {
    const result = allResults[i];
    if (result.status === 'rejected') {
      report.failed++;
      const cat = allCategories[i];
      report.errors.push({
        name: cat?.name ?? 'unknown',
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    }
  }

  return report;
}

// ─── Request Body 类型 ────────────────────────────────────────────────────────

interface SyncRequestBody {
  /** 同步类型：products / categories / all */
  type?: 'products' | 'categories' | 'all';
  /** Magento 根分类 ID（默认 2）*/
  categoryId?: number;
  /** 每页商品数（默认 20，最大 100）*/
  limit?: number;
  /** 当前页（默认 1，支持翻页同步大量商品）*/
  page?: number;
  /**
   * 同步模式：
   * - import（默认）：首次导入，同步所有字段含 description
   * - sync：增量同步，只更新 Magento 来源字段，不覆盖编辑器内容
   */
  mode?: 'import' | 'sync';
  /** 预演模式：不写入 Strapi，只返回将要创建/更新的数量（默认 false）*/
  dryRun?: boolean;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
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

  let body: SyncRequestBody = {};
  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    // body 可选，允许空 body
  }

  const type = body.type ?? 'products';
  const categoryId = body.categoryId ?? 2;
  const limit = Math.min(100, Math.max(1, body.limit ?? 20));
  const page = Math.max(1, body.page ?? 1);
  const mode = body.mode ?? 'import';
  const dryRun = body.dryRun ?? false;

  const startTime = Date.now();
  const results: Record<string, unknown> = {
    syncType: type,
    mode,
    dryRun,
    startedAt: new Date().toISOString(),
  };

  try {
    if (type === 'products' || type === 'all') {
      results.products = await syncProducts({
        categoryId,
        limit,
        page,
        mode,
        dryRun,
      });
    }

    if (type === 'categories' || type === 'all') {
      results.categories = await syncCategories({ dryRun });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Sync failed',
        detail: error instanceof Error ? error.message : String(error),
        ...results,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ...results,
    elapsedMs: Date.now() - startTime,
  });
}

export const runtime = 'nodejs';
// 同步大量商品时需要更长超时
export const maxDuration = 60;
