import { createAuthErrorResponse, login } from '@/features/auth/auth.service';

export async function POST(request: Request) {
  try {
    return await login(request);
  } catch (error) {
    return createAuthErrorResponse(error, 'Login failed');
  }
}
