import { NextResponse } from 'next/server';
import { withAccountService } from '@/features/account/http.api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');
  if (!countryCode) {
    return NextResponse.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: 'country query param is required',
        },
      },
      { status: 400 }
    );
  }
  return withAccountService(request, async service => {
    const regions = await service.getRegions(countryCode);
    return { regions };
  });
}
