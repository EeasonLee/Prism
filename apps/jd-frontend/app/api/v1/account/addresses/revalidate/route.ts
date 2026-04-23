import { withAccountService } from '@/lib/api/bff/account/http';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withAccountService(request, async service => {
    await service.revalidateCountries();
    return { success: true };
  });
}
