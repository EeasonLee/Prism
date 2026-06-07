import { NextResponse } from 'next/server';
import { ApiError } from './errors';

type ApiErrorResponse = {
  success: false;
  data: null;
  error: {
    message: string;
    code: string;
    detail?: unknown;
  };
};

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          message: error.message,
          code: error.code ?? 'API_ERROR',
          detail: error.data,
        },
      },
      { status: error.status || 500 }
    );
  }

  const message =
    error instanceof Error ? error.message : 'Internal server error';

  return NextResponse.json(
    {
      success: false,
      data: null,
      error: { message, code: 'INTERNAL_ERROR' },
    },
    { status: 500 }
  );
}
