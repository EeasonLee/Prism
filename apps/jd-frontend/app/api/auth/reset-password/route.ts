import { NextResponse } from 'next/server';
import { magentoClient } from '@/core/api/clients/magento';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      resetToken?: string;
      newPassword?: string;
    };

    const email = body.email?.trim();
    const resetToken = body.resetToken?.trim();
    const newPassword = body.newPassword;

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json(
        {
          error: {
            message: 'Email, reset token, and new password are required',
            code: 'MISSING_REQUIRED_FIELD',
          },
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error: {
            message: 'Password must be at least 8 characters',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    await magentoClient.post<boolean>('customers/resetPassword', {
      body: { email, resetToken, newPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to reset password';
    const status = (error as { status?: number })?.status ?? 500;

    return NextResponse.json(
      { error: { message, code: 'RESET_PASSWORD_FAILED' } },
      { status }
    );
  }
}
