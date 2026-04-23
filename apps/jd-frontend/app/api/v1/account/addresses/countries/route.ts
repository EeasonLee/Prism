import { withAccountService } from '@/lib/api/bff/account/http';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAccountService(request, async service => {
    const countries = await service.getCountries();
    return { countries };
  });
}
