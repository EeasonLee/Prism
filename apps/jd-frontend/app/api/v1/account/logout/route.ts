import { NextResponse } from 'next/server';
import { accountErrorResponse } from '@/lib/api/bff/account/http';
import { createAccountService } from '@/lib/api/bff/account/service';
import { clearSessionCookies } from '@/lib/auth/cookies';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const service = await createAccountService(request);
    await service.logout();

    const response = NextResponse.json({ success: true });
    clearSessionCookies(response);
    return response;
  } catch (error) {
    return accountErrorResponse(error);
  }
}
