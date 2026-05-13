import { withAccountService } from '@/features/account/http.api';
import type { UpdateUserInput } from '@/features/account/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAccountService(request, async service => {
    const user = await service.getProfile();
    return { user };
  });
}

export async function PUT(request: Request) {
  const input = (await request.json()) as UpdateUserInput;
  return withAccountService(request, async service => {
    await service.updateProfile(input);
    const user = await service.getProfile();
    return { user };
  });
}

export async function DELETE(request: Request) {
  return withAccountService(request, async service => {
    await service.deleteAccount();
    return { success: true };
  });
}
