import { NextResponse } from 'next/server';
import { magentoClient } from '@/core/api/clients/magento';
import { isApiError } from '@/core/api/errors';
import { env } from '@/core/config/env';

const isDev = env.NODE_ENV === 'development';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim();

    if (!email) {
      return NextResponse.json(
        {
          error: {
            message: 'Email is required',
            code: 'MISSING_REQUIRED_FIELD',
          },
        },
        { status: 400 }
      );
    }

    if (isDev) {
      console.log(
        '[forgot-password] Requesting Magento PUT customers/password for:',
        email
      );
    }

    // Note: Do NOT include websiteId - Magento will auto-detect it
    const result = await magentoClient.put<boolean>('customers/password', {
      body: { email, template: 'email_reset' },
    });

    if (isDev) {
      console.log('[forgot-password] Magento responded:', result);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isDev) {
      console.error('[forgot-password] Magento request failed:', {
        isApiError: isApiError(error),
        status: (error as { status?: number })?.status,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (isApiError(error) && error.status === 404) {
      return NextResponse.json(
        {
          error: {
            message: 'If this email exists, a reset link has been sent.',
            code: 'NOT_FOUND',
          },
        },
        { status: 200 }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Failed to send reset email';
    const status = (error as { status?: number })?.status ?? 500;

    return NextResponse.json(
      { error: { message, code: 'RESET_EMAIL_FAILED' } },
      { status }
    );
  }
}
