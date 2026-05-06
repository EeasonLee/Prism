import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = url.pathname.replace('/api/v1/auth/', '/api/auth/');
  return NextResponse.redirect(url, 307);
}
