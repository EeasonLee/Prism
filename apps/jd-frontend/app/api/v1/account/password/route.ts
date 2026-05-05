import { withAccountService } from '@/features/account/http.api';
import type { ChangePasswordInput } from '@/features/account/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const input = (await request.json()) as ChangePasswordInput;
  return withAccountService(request, async service => {
    await service.changePassword(input);
    return { success: true };
  });
}
