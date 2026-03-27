import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@prism/shared';
import { apiClient } from '../../../../lib/api/client';

interface HelpfulRequestBody {
  documentId?: unknown;
  dedupeKey?: unknown;
}

interface HelpfulResponseRaw {
  data?: {
    helpfulCount?: number;
    viewerHasMarkedHelpful?: boolean;
  };
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as HelpfulRequestBody;
  const documentId = normalizeText(body.documentId);
  const dedupeKey = normalizeText(body.dedupeKey);

  if (!documentId) {
    return NextResponse.json(
      { error: 'documentId is required' },
      { status: 400 }
    );
  }
  if (!dedupeKey) {
    return NextResponse.json(
      { error: 'dedupeKey is required' },
      { status: 400 }
    );
  }

  try {
    const response = await apiClient.post<HelpfulResponseRaw>(
      `api/product-reviews/${encodeURIComponent(documentId)}/helpful`,
      {
        dedupeKey,
      },
      {
        cache: 'no-store',
        skipLogging: true,
      } as Parameters<typeof apiClient.post>[2]
    );

    return NextResponse.json({
      helpfulCount: Number(response.data?.helpfulCount ?? 0),
      viewerHasMarkedHelpful: response.data?.viewerHasMarkedHelpful ?? false,
    });
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

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update helpful state',
      },
      { status: 502 }
    );
  }
}

export const runtime = 'nodejs';
