import { withAccountService } from '@/lib/api/bff/account/http';
import type { AddressInput } from '@/lib/api/bff/account/types';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const addressId = Number.parseInt(id, 10);
  const input = (await request.json()) as AddressInput;
  return withAccountService(request, async service => {
    const address = await service.updateAddress(addressId, input);
    return { address };
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const addressId = Number.parseInt(id, 10);
  return withAccountService(request, async service => {
    await service.deleteAddress(addressId);
    return { success: true };
  });
}
