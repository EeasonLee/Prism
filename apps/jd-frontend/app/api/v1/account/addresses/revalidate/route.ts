import { withAccountService } from '@/features/account/http.api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withAccountService(request, async service => {
    await service.revalidateCountries();
    return { success: true };
  });
}
