import { NextResponse } from 'next/server';
import { categoryService } from '@/features/category/category.service';
import { mapCategoryTree } from '@/features/category/category.mapper';

// Numeric literal required by Next.js; sync with REVALIDATE_SECONDS_CATEGORY_NAV in cache-policy.ts
export const revalidate = 3600;

export async function GET() {
  try {
    const tree = await categoryService.getCategoryTree();
    const mapped = mapCategoryTree(tree);

    return NextResponse.json({
      success: true,
      data: mapped.children,
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
            error instanceof Error
              ? error.message
              : 'Failed to fetch categories',
        },
      },
      { status: 500 }
    );
  }
}
