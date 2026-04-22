import { NextResponse } from 'next/server';
import { withAccountService } from '@/lib/api/bff/account/http';

export const GET = withAccountService(async (_req, service) => {
  const countries = await service.getCountries();
  return NextResponse.json({ countries });
});
