import { NextResponse } from 'next/server';
import { productService } from '@/lib/services/product.service';
import { mapProductList } from '@/lib/mappers/product.mapper';

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;
  const sort = searchParams.get('sort') as 'name' | 'price' | null;

  try {
    const response = await productService.getProducts({
      categoryId: categoryId ? Number(categoryId) : undefined,
      page,
      pageSize: limit,
      sort: sort || undefined,
    });

    const mapped = mapProductList(
      response.items,
      response.page_info.current_page,
      response.total_count,
      response.page_info.total_pages
    );

    return NextResponse.json({
      success: true,
      data: mapped,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'PRODUCT_FETCH_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch products',
        },
      },
      { status: 500 }
    );
  }
}
