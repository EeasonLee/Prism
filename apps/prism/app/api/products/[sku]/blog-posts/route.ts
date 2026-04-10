import { NextResponse } from 'next/server';
import { getProductBlogPostsBFF } from '@/lib/api/bff/product/blog-posts';

// Numeric literal required by Next.js; sync with REVALIDATE_SECONDS_CMS_ASSOCIATION in cache-policy.ts
export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;
  const data = await getProductBlogPostsBFF(sku);

  return NextResponse.json({ success: true, data, error: null });
}
