import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import { submitProductQuestion } from '@/features/product';
import { getAccessToken } from '@/features/auth/cookies';
import { guestAuthorLabelFromEmail, isReasonableEmail } from '@prism/shared';

interface SubmitQuestionRequestBody {
  productId?: unknown;
  sku?: unknown;
  content?: unknown;
  authorName?: unknown;
  authorEmail?: unknown;
  magentoUserId?: unknown;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  const body = (await request
    .json()
    .catch(() => ({}))) as SubmitQuestionRequestBody;

  const rawProductId = body.productId;
  const productId =
    rawProductId === undefined || rawProductId === null || rawProductId === ''
      ? null
      : Number(rawProductId);
  const sku = normalizeText(body.sku);
  const content = normalizeText(body.content);
  const authorName = normalizeText(body.authorName);
  const authorEmail = normalizeText(body.authorEmail);
  const magentoUserId = normalizeText(body.magentoUserId);

  if (!sku) return badRequest('sku is required');
  if (!content || content.length < 10 || content.length > 500) {
    return badRequest('content must be between 10 and 500 characters');
  }
  if (!authorEmail) return badRequest('authorEmail is required');
  if (!isReasonableEmail(authorEmail)) {
    return badRequest('authorEmail is invalid');
  }
  const resolvedAuthorName =
    authorName || guestAuthorLabelFromEmail(authorEmail);

  const authorization = request.headers.get('authorization');
  const accessToken =
    authorization?.replace(/^Bearer\s+/i, '') ?? getAccessToken(request);

  try {
    const result = await submitProductQuestion(
      {
        ...(Number.isInteger(productId) && (productId ?? 0) > 0
          ? { productId: productId as number }
          : {}),
        sku,
        content,
        authorName: resolvedAuthorName,
        authorEmail,
        ...(magentoUserId ? { magentoUserId } : {}),
      },
      accessToken
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
