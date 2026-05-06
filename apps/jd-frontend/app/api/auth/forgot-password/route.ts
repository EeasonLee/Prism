import { NextResponse } from 'next/server';
import { forgotPassword } from '@/features/auth';

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

    await forgotPassword(email);

    return NextResponse.json({ success: true });
  } catch (error) {
    const status = (error as { status?: number })?.status;

    // Don't leak whether email exists
    if (status === 404) {
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
    const resolvedStatus = status ?? 500;

    return NextResponse.json(
      { error: { message, code: 'RESET_EMAIL_FAILED' } },
      { status: resolvedStatus }
    );
  }
}
