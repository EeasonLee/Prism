'use client';

import { useEffect } from 'react';
import { logger } from '../lib/observability/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Global error boundary triggered', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Please try again or contact support.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
