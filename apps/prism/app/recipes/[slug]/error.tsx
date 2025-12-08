'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error('Recipe detail page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Error</h1>
        <p className="mt-4 text-lg text-gray-600">
          {error.message || 'An error occurred while loading the recipe'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Retry
          </button>
          <Link
            href="/recipes"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Recipes
          </Link>
        </div>
      </div>
    </div>
  );
}
