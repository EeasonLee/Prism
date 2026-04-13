import { createAuthErrorResponse, refreshSession } from '@/lib/auth/service';

export async function POST(request: Request) {
  try {
    return await refreshSession(request);
  } catch (error) {
    return createAuthErrorResponse(error, 'Token refresh failed');
  }
}
