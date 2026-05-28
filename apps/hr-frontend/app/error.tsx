'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="hr-container flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-bold text-ink">页面出错了</h1>
      <p className="mt-3 max-w-md text-sm text-ink-muted">
        {error.message || '请稍后重试。'}
      </p>
      <button type="button" onClick={reset} className="hr-btn-primary mt-6">
        重试
      </button>
    </main>
  );
}
