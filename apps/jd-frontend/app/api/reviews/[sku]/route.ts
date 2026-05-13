import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import { fetchReviewsBySku, submitReview } from '@/features/product';
import { guestAuthorLabelFromEmail, isReasonableEmail } from '@prism/shared';

interface SubmitReviewRequestBody {
  sku?: unknown;
  authorName?: unknown;
  authorEmail?: unknown;
  magentoUserId?: unknown;
  rating?: unknown;
  title?: unknown;
  content?: unknown;
  mediaIds?: unknown;
  reviewTagSlugs?: unknown;
  dimensionRatings?: unknown;
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

function decodeSku(rawSku: string) {
  try {
    return decodeURIComponent(rawSku);
  } catch {
    return rawSku;
  }
}

function parseCommaNumbers(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map(item => Number(item.trim()))
    .filter(
      item =>
        Number.isFinite(item) &&
        item >= 1 &&
        item <= 5 &&
        item * 2 === Math.round(item * 2)
    );
}

function parseCommaStrings(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
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
  const ratings = parseCommaNumbers(
    request.nextUrl.searchParams.get('ratings')
  );
  const tagSlugs = parseCommaStrings(
    request.nextUrl.searchParams.get('tagSlugs')
  );

  try {
    const reviews = await fetchReviewsBySku(
      decodeURIComponent(sku),
      page,
      pageSize,
      sort === 'highest_rating' || sort === 'most_helpful' ? sort : 'newest',
      dedupeKey,
      {
        ratings,
        tagSlugs,
      }
    );
    return NextResponse.json(reviews);
  } catch (error) {
    return handleApiError(error);
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

  const routeSku = normalizeText(decodeSku(sku));
  const bodySku = normalizeText(body.sku);
  const requestSku = routeSku || bodySku;

  if (!requestSku) return badRequest('sku is required');
  if (routeSku && bodySku && routeSku !== bodySku) {
    return badRequest('sku in path and body must match');
  }

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
  const reviewTagSlugs = Array.isArray(body.reviewTagSlugs)
    ? body.reviewTagSlugs.map(value => normalizeText(value)).filter(Boolean)
    : [];
  const dimensionRatings = Array.isArray(body.dimensionRatings)
    ? body.dimensionRatings
        .map(item => {
          if (!item || typeof item !== 'object') return null;
          const tagSlug = normalizeText(
            (item as { tagSlug?: unknown }).tagSlug
          );
          const score = Number((item as { score?: unknown }).score);
          if (!tagSlug || !Number.isInteger(score) || score < 0 || score > 5) {
            return null;
          }
          return {
            tagSlug,
            score,
          };
        })
        .filter(
          (value): value is { tagSlug: string; score: number } => value !== null
        )
    : [];

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
        sku: requestSku,
        authorName: resolvedAuthorName,
        authorEmail,
        ...(magentoUserId ? { magentoUserId } : {}),
        rating,
        title,
        content,
        mediaIds,
        reviewTagSlugs,
        dimensionRatings,
      },
      authorization?.replace(/^Bearer\s+/i, '') ?? null
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
