import { NextResponse } from 'next/server';
import { getCountriesList } from '@/features/account/countries-data.api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const countries = getCountriesList();
  return NextResponse.json({ countries });
}
