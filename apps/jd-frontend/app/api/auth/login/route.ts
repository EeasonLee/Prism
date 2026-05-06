import { createAuthErrorResponse, login } from '@/features/auth';

export async function POST(request: Request) {
  try {
    return await login(request);
  } catch (error) {
    return createAuthErrorResponse(error, 'Login failed');
  }
}
