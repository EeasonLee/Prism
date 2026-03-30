import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@prism/shared';
import { submitProductQuestion } from '@/lib/api/strapi/product-qa';

interface SubmitQuestionRequestBody {
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

  const sku = normalizeText(body.sku);
  const content = normalizeText(body.content);
  const authorName = normalizeText(body.authorName);
  const authorEmail = normalizeText(body.authorEmail);
  const magentoUserId = normalizeText(body.magentoUserId);

  if (!sku) return badRequest('sku is required');
  if (!content || content.length < 10 || content.length > 500) {
    return badRequest('content must be between 10 and 500 characters');
  }
  if (!authorName) return badRequest('authorName is required');
  if (!authorEmail) return badRequest('authorEmail is required');
  if (!magentoUserId) return badRequest('magentoUserId is required');

  const authorization = request.headers.get('authorization');
  if (!authorization) return badRequest('Authorization header is required');
  const accessToken = authorization.replace(/^Bearer\s+/i, '');

  try {
    const result = await submitProductQuestion(
      {
        sku,
        content,
        authorName,
        authorEmail,
        magentoUserId,
      },
      accessToken
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
        { error: message, detail: data },
        { status: error.status }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Failed to submit question';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const runtime = 'nodejs';
