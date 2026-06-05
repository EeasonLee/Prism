'use client';

import { Button, PageContainer } from '@prism/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 items-center">
      <PageContainer className="py-16">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
            Application error
          </p>
          <h1 className="mt-4 text-3xl font-bold text-foreground">
            Something went wrong.
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {error.message || 'The app could not render this page.'}
          </p>
          <Button className="mt-6" onClick={reset}>
            Try again
          </Button>
        </div>
      </PageContainer>
    </main>
  );
}
