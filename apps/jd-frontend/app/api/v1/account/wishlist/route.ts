import { NextResponse } from 'next/server';
import { withAccountService } from '@/lib/api/bff/account/http';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAccountService(request, async service => {
    const items = await service.getWishlist();
    return { items };
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { sku?: string };
  const sku = body.sku?.trim();

  if (!sku) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'SKU is required' } },
      { status: 400 }
    );
  }

  return withAccountService(request, async service => {
    await service.addToWishlist(sku);
    return { success: true };
  });
}
