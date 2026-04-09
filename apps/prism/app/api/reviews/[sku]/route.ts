import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@prism/shared';
import {
  fetchReviewsBySku,
  submitReview,
} from '../../../../lib/api/strapi/reviews';
import {
  guestAuthorLabelFromEmail,
  isReasonableEmail,
} from '../../../../lib/validation/email';

interface SubmitReviewRequestBody {
  productSku?: unknown;
  purchasedSku?: unknown;
  purchasedVariantLabel?: unknown;
  authorName?: unknown;
  authorEmail?: unknown;
  magentoUserId?: unknown;
  rating?: unknown;
  title?: unknown;
  content?: unknown;
  mediaIds?: unknown;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRating(value: unknown) {
  return typeof value === 'number' ? value : Number(value);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sku: string }> }
) {
  const { sku } = await context.params;
  const page = Math.max(
    1,
    Number(request.nextUrl.searchParams.get('page') ?? '1')
  );
  const pageSize = Math.min(
    50,
    Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') ?? '10'))
  );
  const sort = request.nextUrl.searchParams.get('sort');
  const dedupeKey = request.nextUrl.searchParams.get('dedupeKey');

  try {
    const reviews = await fetchReviewsBySku(
      decodeURIComponent(sku),
      page,
      pageSize,
      sort === 'highest_rating' || sort === 'most_helpful' ? sort : 'newest',
      dedupeKey
    );
    return NextResponse.json(reviews);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch reviews';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sku: string }> }
) {
  const { sku } = await context.params;
  const body = (await request
    .json()
    .catch(() => ({}))) as SubmitReviewRequestBody;

  const productSku = normalizeText(body.productSku) || decodeURIComponent(sku);
  const purchasedSku = normalizeText(body.purchasedSku);
  const purchasedVariantLabel = normalizeText(body.purchasedVariantLabel);
  const authorName = normalizeText(body.authorName);
  const authorEmail = normalizeText(body.authorEmail);
  const magentoUserId = normalizeText(body.magentoUserId);
  const title = normalizeText(body.title);
  const content = normalizeText(body.content);
  const rating = normalizeRating(body.rating);
  const mediaIds = Array.isArray(body.mediaIds)
    ? body.mediaIds
        .map(value => Number.parseInt(String(value), 10))
        .filter(Number.isInteger)
    : [];

  if (!productSku) return badRequest('productSku is required');
  if (!purchasedSku) return badRequest('purchasedSku is required');
  if (!authorEmail) return badRequest('authorEmail is required');
  if (!isReasonableEmail(authorEmail)) {
    return badRequest('authorEmail is invalid');
  }
  const resolvedAuthorName =
    authorName || guestAuthorLabelFromEmail(authorEmail);
  if (!title || title.length < 3 || title.length > 150) {
    return badRequest('title must be between 3 and 150 characters');
  }
  if (!content || content.length < 10 || content.length > 2000) {
    return badRequest('content must be between 10 and 2000 characters');
  }
  if (
    !Number.isFinite(rating) ||
    rating < 1 ||
    rating > 5 ||
    rating * 2 !== Math.round(rating * 2)
  ) {
    return badRequest('rating must be between 1 and 5 in 0.5 increments');
  }

  const authorization = request.headers.get('authorization');

  try {
    const result = await submitReview(
      {
        sku: decodeURIComponent(sku),
        productSku,
        purchasedSku,
        purchasedVariantLabel: purchasedVariantLabel || null,
        authorName: resolvedAuthorName,
        authorEmail,
        ...(magentoUserId ? { magentoUserId } : {}),
        rating,
        title,
        content,
        mediaIds,
      },
      authorization?.replace(/^Bearer\s+/i, '') ?? null
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      const data =
        typeof error.data === 'object' && error.data !== null
          ? (error.data as Record<string, unknown>)
          : undefined;
      const message =
        typeof data?.error === 'string'
          ? data.error
          : typeof data?.message === 'string'
          ? data.message
          : error.message;
      return NextResponse.json(
        {
          error: message,
          detail: data,
        },
        { status: error.status }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Failed to submit review';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const runtime = 'nodejs';
