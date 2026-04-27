import { NextResponse } from 'next/server';
import { withAccountService } from '@/lib/api/bff/account/http';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = Number.parseInt(id, 10);

  if (Number.isNaN(itemId)) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Invalid wishlist item ID' } },
      { status: 400 }
    );
  }

  return withAccountService(request, async service => {
    await service.removeFromWishlist(itemId);
    return { success: true };
  });
}
