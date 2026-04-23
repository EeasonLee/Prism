import { withAccountService } from '@/lib/api/bff/account/http';
import type { ChangePasswordInput } from '@/lib/api/bff/account/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const input = (await request.json()) as ChangePasswordInput;
  return withAccountService(request, async service => {
    await service.changePassword(input);
    return { success: true };
  });
}
