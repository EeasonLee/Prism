import { NextResponse } from 'next/server';
import { getProductRecipesBFF } from '@/lib/api/bff/product/recipes';

// Numeric literal required by Next.js; sync with REVALIDATE_SECONDS_CMS_ASSOCIATION in cache-policy.ts
export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;
  const data = await getProductRecipesBFF(sku);

  return NextResponse.json({ success: true, data, error: null });
}
