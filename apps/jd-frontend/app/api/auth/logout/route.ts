import { clearSessionOnError, logout } from '@/lib/auth/service';

export async function POST(request: Request) {
  try {
    return await logout(request);
  } catch (error) {
    return clearSessionOnError(error, 'Logout failed');
  }
}
