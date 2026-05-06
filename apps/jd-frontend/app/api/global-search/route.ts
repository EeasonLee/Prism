import { NextResponse } from 'next/server';
import { productQueryFacade } from '@/features/product';
import { searchArticles } from '@/features/blog/api';
import { fetchRecipeKeywordSearchStrapi } from '@/features/recipe';
import { handleApiError } from '@/infrastructure/api/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LIMIT = 5;

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

  try {
    const [productsResult, articlesResult, recipesResult] =
      await Promise.allSettled([
        productQueryFacade.queryProducts({ q, pageSize: LIMIT }),
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
  } catch (error) {
    return handleApiError(error);
  }
}
