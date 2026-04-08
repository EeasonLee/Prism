import { NextResponse } from 'next/server';
import { REVALIDATE_SECONDS_CATALOG_SNAPSHOT } from '@/lib/api/cache-policy';

export const revalidate = REVALIDATE_SECONDS_CATALOG_SNAPSHOT;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');

  // 预留 meilisearch 集成
  // TODO: 对接 meilisearch 获取动态筛选器

  return NextResponse.json({
    success: true,
    data: {
      categoryId,
      filters: [],
      message: 'Filters endpoint reserved for meilisearch integration',
    },
    error: null,
  });
}
