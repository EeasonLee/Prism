import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/infrastructure/config/env';
import { handleApiError } from '@/infrastructure/api/route-helpers';

interface InventoryBulkRequest {
  skus: string[];
}

interface InventoryItem {
  sku: string;
  salable_qty: number;
  is_salable: boolean;
  stock_status: string;
  image_url?: string;
  updated_at?: string;
}

interface InventoryBulkResponse {
  items: Record<string, InventoryItem>;
  not_found: string[];
}

/**
 * POST /api/inventory/bulk
 *
 * Proxy to catalog-sync-service /v1/inventory/bulk.
 * Client-side CartDrawer calls this to avoid exposing internal
 * CATALOG_SYNC_URL (localhost:4041) to the browser.
 */
export async function POST(request: NextRequest) {
  let body: InventoryBulkRequest;
  try {
    body = (await request.json()) as InventoryBulkRequest;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Invalid JSON body', code: 'BAD_REQUEST' },
      },
      { status: 400 }
    );
  }

  const skus = body.skus?.filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  );
  if (!skus || skus.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Missing or empty skus array', code: 'BAD_REQUEST' },
      },
      { status: 400 }
    );
  }

  const catalogSyncUrl = env.NEXT_PUBLIC_CATALOG_SYNC_URL?.trim();
  if (!catalogSyncUrl) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Catalog sync URL not configured',
          code: 'CONFIG_ERROR',
        },
      },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${catalogSyncUrl}/v1/inventory/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skus }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Catalog sync service returned ${res.status}: ${text}`,
            code: 'UPSTREAM_ERROR',
          },
        },
        { status: 502 }
      );
    }

    const data = (await res.json()) as InventoryBulkResponse;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
