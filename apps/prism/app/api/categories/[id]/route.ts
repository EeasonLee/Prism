import { NextResponse } from 'next/server';
import { categoryService } from '@/lib/services/category.service';
import { mapCategoryDetail } from '@/lib/mappers/category.mapper';

// Numeric literal required by Next.js; sync with REVALIDATE_SECONDS_CATEGORY_DETAIL in cache-policy.ts
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const categoryId = Number(id);

  if (isNaN(categoryId)) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'INVALID_ID', message: 'Category id must be a number' },
      },
      { status: 400 }
    );
  }

  try {
    const detail = await categoryService.getCategoryDetail(categoryId);
    return NextResponse.json({
      success: true,
      data: mapCategoryDetail(detail),
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'CATEGORY_FETCH_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch category',
        },
      },
      { status: 500 }
    );
  }
}
