import { NextResponse } from 'next/server';
import { withAccountService } from '@/lib/api/bff/account/http';

export const GET = withAccountService(async (req, service) => {
  const { searchParams } = new URL(req.url);
  const countryCode = searchParams.get('country');
  if (!countryCode) {
    return NextResponse.json(
      { error: 'country query param is required' },
      { status: 400 }
    );
  }
  const regions = await service.getRegions(countryCode);
  return NextResponse.json({ regions });
});
