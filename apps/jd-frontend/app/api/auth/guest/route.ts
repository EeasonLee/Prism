import { createAuthErrorResponse, createGuestSession } from '@/features/auth';

export async function POST() {
  try {
    return await createGuestSession();
  } catch (error) {
    return createAuthErrorResponse(error, 'Guest login failed');
  }
}
