import { NextResponse } from 'next/server';
import { getHeaderMenu } from '@/lib/api/bff/navigation/header-menu';

// Numeric literal required by Next.js; sync with REVALIDATE_SECONDS_CATEGORY_NAV in cache-policy.ts
export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') ?? 'en';

  try {
    const data = await getHeaderMenu(locale);
    return NextResponse.json({
      success: true,
      data,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: { items: [] },
        error: {
          code: 'HEADER_MENU_FETCH_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch header menu',
        },
      },
      { status: 500 }
    );
  }
}
