import { NextResponse } from 'next/server';
import { categoryService } from '@/lib/services/category.service';
import { mapBreadcrumbs } from '@/lib/mappers/category.mapper';

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
    const breadcrumbs = mapBreadcrumbs(detail.breadcrumbs ?? []);

    return NextResponse.json({
      success: true,
      data: breadcrumbs,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'BREADCRUMB_FETCH_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch breadcrumbs',
        },
      },
      { status: 500 }
    );
  }
}
