'use client';

import { useEffect } from 'react';
import { ErrorPage } from '../../../components/ErrorPage';

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
    <ErrorPage
      title="Error"
      message={error.message || 'An error occurred while loading the recipe'}
      actionLabel="Retry"
      onAction={reset}
      backHref="/recipes"
      backLabel="Back to Recipes"
    />
  );
}
