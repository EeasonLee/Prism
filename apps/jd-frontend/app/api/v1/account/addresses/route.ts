import { withAccountService } from '@/features/account/http.api';
import type { AddressInput } from '@/features/account/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAccountService(request, async service => {
    const addresses = await service.getAddresses();
    return { addresses };
  });
}

export async function POST(request: Request) {
  const input = (await request.json()) as AddressInput;
  return withAccountService(request, async service => {
    const address = await service.createAddress(input);
    return { address };
  });
}
