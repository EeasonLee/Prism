import { NextResponse } from 'next/server';
import { handleApiError } from '@/core/api/route-helpers';
import { fetchReviewTags } from '@/features/product/reviews.api';

export async function GET() {
  try {
    const tags = await fetchReviewTags();
    return NextResponse.json({ items: tags });
  } catch (error) {
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
