import { NextResponse } from 'next/server';
import { productQueryFacade } from '@/features/product/query-facade';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const strapiCategoryIdParam = searchParams.get('strapiCategoryId');
  const strapiCategorySlugParam = searchParams.get('strapiCategorySlug');
  const legacyCategoryUrlKeyParam = searchParams.get('categoryUrlKey');
  const magentoCategoryIdParam = searchParams.get('magentoCategoryId');
  const pageSize = Math.min(
    48,
    Math.max(1, Number(searchParams.get('pageSize') ?? '8'))
  );

  const strapiCategoryId = strapiCategoryIdParam
    ? Number(strapiCategoryIdParam)
    : undefined;
  const magentoCategoryId = magentoCategoryIdParam
    ? Number(magentoCategoryIdParam)
    : undefined;
  const strapiCategorySlug =
    strapiCategorySlugParam?.trim() ||
    legacyCategoryUrlKeyParam?.trim() ||
    undefined;

  if (
    (strapiCategoryId === undefined || Number.isNaN(strapiCategoryId)) &&
    !strapiCategorySlug &&
    (magentoCategoryId === undefined || Number.isNaN(magentoCategoryId))
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          'strapiCategoryId or strapiCategorySlug or magentoCategoryId is required',
      },
      { status: 400 }
    );
  }

  try {
    const result = await productQueryFacade.queryProducts({
      strapiCategoryId,
      strapiCategorySlug,
      magentoCategoryId,
      page: 1,
      pageSize,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to fetch deal products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
