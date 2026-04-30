import type { ReactNode } from 'react';

import { cn } from '@prism/shared';

export function FoundationPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 space-y-2">
          <p className="micro-text text-ink-faint">基础规范</p>
          <h1 className="heading-3 text-ink">{title}</h1>
          <p className="body-text text-ink-muted">{description}</p>
        </header>
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}

export function FoundationSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="heading-4 text-ink">{title}</h2>
        <p className="body-text text-ink-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function FoundationCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 shadow-card-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
