import { getSessionResponse } from '@/lib/auth/getSession';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const response = await getSessionResponse(request);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}
