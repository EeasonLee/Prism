import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { CACHE_TAG_HEADER_MENU } from '@/lib/api/cache-policy';

export async function POST(request: Request) {
  const envSecret = process.env.REVALIDATE_SECRET;
  if (!envSecret) {
    return NextResponse.json(
      { success: false, message: 'REVALIDATE_SECRET is not configured' },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { secret?: string };
  if (body.secret !== envSecret) {
    return NextResponse.json(
      { success: false, message: 'Invalid secret' },
      { status: 401 }
    );
  }

  revalidateTag(CACHE_TAG_HEADER_MENU);
  return NextResponse.json({
    success: true,
    revalidatedTags: [CACHE_TAG_HEADER_MENU],
    now: Date.now(),
  });
}

export const runtime = 'nodejs';
