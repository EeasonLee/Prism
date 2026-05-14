import { NextResponse } from 'next/server';
import { getCountryRegions } from '@/features/account/countries-data.api';

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
  const regions = getCountryRegions(countryCode);
  return NextResponse.json({ regions });
}
