import { NextResponse } from 'next/server';
import { searchProducts } from '@/features/search/search-meilisearch';
import { searchArticles } from '@/features/blog/api';
import { fetchRecipeKeywordSearchStrapi } from '@/features/recipe/recipes.api';
import type { MeilisearchSearchResult } from '@/features/search/search-meilisearch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LIMIT = 5;

async function searchProductsWithFallback(
  q: string
): Promise<MeilisearchSearchResult> {
  const primary = await searchProducts({ q, page: 1, pageSize: LIMIT });

  // Meilisearch 默认只做前缀/整词匹配，不支持子串（如 270 搜不到 JD-PB270）。
  // 当主搜索无结果且关键词长度 >= 2 时，fallback 到内存子串匹配。
  if (primary.items.length === 0 && q.length >= 2) {
    const all = await searchProducts({ q: '', page: 1, pageSize: 1000 });
    const term = q.toLowerCase();
    const filtered = all.items.filter(
      item =>
        item.sku.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term)
    );
    return {
      items: filtered.slice(0, LIMIT),
      pagination: {
        page: 1,
        pageSize: LIMIT,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / LIMIT) || 1,
      },
    };
  }

  return primary;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({
      products: { items: [], total: 0 },
      articles: { items: [], total: 0 },
      recipes: { items: [], total: 0 },
    });
  }

  const [productsResult, articlesResult, recipesResult] =
    await Promise.allSettled([
      searchProductsWithFallback(q),
      searchArticles({ q, page: 1, pageSize: LIMIT }),
      fetchRecipeKeywordSearchStrapi({ q, page: 1, pageSize: LIMIT }),
    ]);

  const products =
    productsResult.status === 'fulfilled'
      ? {
          items: productsResult.value.items,
          total: productsResult.value.pagination.total,
        }
      : { items: [], total: 0 };

  const articles =
    articlesResult.status === 'fulfilled'
      ? {
          items: articlesResult.value.data,
          total: articlesResult.value.meta.pagination.total,
        }
      : { items: [], total: 0 };

  const recipes =
    recipesResult.status === 'fulfilled'
      ? {
          items: recipesResult.value.data,
          total: recipesResult.value.meta.pagination.total,
        }
      : { items: [], total: 0 };

  return NextResponse.json({ products, articles, recipes });
}
