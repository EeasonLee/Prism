import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import { searchArticles } from '@/features/blog';
import type { ArticleSort } from '@/features/blog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const q = sp.get('q')?.trim() || undefined;
  const page = Number(sp.get('page')) || 1;
  const pageSize = Number(sp.get('pageSize')) || 10;
  const sort = (sp.get('sort') as ArticleSort) || 'publishedAt:desc';
  const locale = sp.get('locale') || undefined;

  const categoryIdsStr = sp.get('categoryIds');
  const categoryIds = categoryIdsStr
    ? categoryIdsStr
        .split(',')
        .map(Number)
        .filter(n => !isNaN(n))
    : undefined;

  const tagIdsStr = sp.get('tagIds');
  const tagIds = tagIdsStr
    ? tagIdsStr
        .split(',')
        .map(Number)
        .filter(n => !isNaN(n))
    : undefined;

  try {
    const result = await searchArticles({
      q,
      page,
      pageSize,
      categoryIds,
      tagIds,
      sort,
      locale,
    });
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    return handleApiError(error);
  }
}
