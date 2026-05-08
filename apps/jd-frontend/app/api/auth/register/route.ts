import { createAuthErrorResponse, register } from '@/features/auth';

export async function POST(request: Request) {
  try {
    return await register(request);
  } catch (error) {
    return createAuthErrorResponse(error, 'Registration failed');
  }
}
