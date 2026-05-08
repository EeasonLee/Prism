import { withAccountService } from '@/features/account/http.api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAccountService(request, async service => {
    const orders = await service.getOrders();
    return { orders };
  });
}
