import { withAccountService } from '@/features/account/http.api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number.parseInt(id, 10);

  if (Number.isNaN(orderId) || orderId <= 0) {
    return Response.json(
      { error: { code: 'INVALID_ID', message: 'Invalid order ID' } },
      { status: 400 }
    );
  }

  return withAccountService(request, async service => {
    const order = await service.getOrder(orderId);
    return { order };
  });
}
