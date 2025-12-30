'use client';

import { useEffect } from 'react';
import { PageContainer } from '@prism/ui/components/PageContainer';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误到日志服务
    console.error('Article detail error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white">
      <PageContainer className="py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Something went wrong!
        </h2>
        <p className="mt-4 text-gray-600">{error.message}</p>
        <button
          onClick={reset}
          className="mt-8 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </PageContainer>
    </div>
  );
}
