import { NextResponse } from 'next/server';
import {
  AccountServiceError,
  createAccountService,
  type AccountService,
} from './account.service';
import type { AccountErrorShape } from './types';

export function accountErrorResponse(
  error: unknown
): NextResponse<AccountErrorShape> {
  if (error instanceof AccountServiceError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    },
    { status: 500 }
  );
}

export async function withAccountService<T>(
  request: Request,
  handler: (service: AccountService) => Promise<T>
): Promise<NextResponse<T | AccountErrorShape>> {
  try {
    const service = await createAccountService(request);
    const payload = await handler(service);
    return NextResponse.json(payload);
  } catch (error) {
    return accountErrorResponse(error);
  }
}
