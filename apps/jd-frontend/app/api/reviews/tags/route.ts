import { NextResponse } from 'next/server';
import { fetchReviewTags } from '../../../../lib/api/strapi/reviews';

export async function GET() {
  try {
    const tags = await fetchReviewTags();
    return NextResponse.json({ items: tags });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch review tags';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const runtime = 'nodejs';
