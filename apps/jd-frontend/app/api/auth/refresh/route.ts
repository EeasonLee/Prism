import { createAuthErrorResponse, refreshSession } from '@/features/auth';

export async function POST(request: Request) {
  try {
    return await refreshSession(request);
  } catch (error) {
    return createAuthErrorResponse(error, 'Token refresh failed');
  }
}
