import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/infrastructure/api/route-helpers';
import { strapiClient } from '@/infrastructure/api/clients/strapi';

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
    const response = await strapiClient.post<HelpfulResponseRaw>(
      `api/product-reviews/${encodeURIComponent(documentId)}/helpful`,
      {
        body: {
          dedupeKey,
        },
        cache: 'no-store',
      }
    );

    return NextResponse.json({
      helpfulCount: Number(response.data?.helpfulCount ?? 0),
      viewerHasMarkedHelpful: response.data?.viewerHasMarkedHelpful ?? false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
