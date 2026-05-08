import { clearSessionOnError, logout } from '@/features/auth';

export async function POST(request: Request) {
  try {
    return await logout(request);
  } catch (error) {
    return clearSessionOnError(error, 'Logout failed');
  }
}
