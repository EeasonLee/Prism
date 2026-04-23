import { NextResponse } from 'next/server';
import { magentoRestFetch } from '@/lib/api/bff/magento-rest-client';
import { isMagentoApiError } from '@/lib/api/magento/client';
import { env } from '@/lib/env';

const isDev = env.NODE_ENV === 'development';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim();

    if (!email) {
      return NextResponse.json(
        { error: { message: 'Email is required', code: 'MISSING_REQUIRED_FIELD' } },
        { status: 400 }
      );
    }

    if (isDev) {
      console.log('[forgot-password] Requesting Magento PUT customers/password for:', email);
    }

    // Note: Do NOT include websiteId - Magento will auto-detect it
    const result = await magentoRestFetch<boolean>('customers/password', {
      method: 'PUT',
      body: JSON.stringify({
        email,
        template: 'email_reset',
      }),
    });

    if (isDev) {
      console.log('[forgot-password] Magento responded:', result);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isDev) {
      console.error('[forgot-password] Magento request failed:', {
        isMagentoApiError: isMagentoApiError(error),
        status: (error as { status?: number })?.status,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (isMagentoApiError(error) && error.status === 404) {
      return NextResponse.json(
        { error: { message: 'If this email exists, a reset link has been sent.', code: 'NOT_FOUND' } },
        { status: 200 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to send reset email';
    const status = (error as { status?: number })?.status ?? 500;

    return NextResponse.json(
      { error: { message, code: 'RESET_EMAIL_FAILED' } },
      { status }
    );
  }
}
