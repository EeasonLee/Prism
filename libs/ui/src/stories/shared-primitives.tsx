import type { ReactNode } from 'react';

import { cn } from '@prism/shared';

export function Page({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 space-y-2">
          <h1 className="heading-3 text-ink">{title}</h1>
          <div className="body-text text-ink-muted">{description}</div>
        </header>
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}

export function Section({
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

export function Card({
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

export function ColorSwatch({
  token,
  className,
  description,
  lightHsl,
}: {
  token: string;
  className: string;
  description: string;
  lightHsl: string;
}) {
  return (
    <Card className="space-y-3">
      <div
        className="h-14 rounded-md border border-border"
        style={{ backgroundColor: `hsl(var(${token}))` }}
      />
      <div className="space-y-1">
        <p className="micro-text text-ink">{token}</p>
        <p className="micro-text text-ink-faint">{className}</p>
        <p className="body-text text-ink-muted">{description}</p>
      </div>
      <p className="micro-text text-ink-faint">浅色 HSL: {lightHsl}</p>
    </Card>
  );
}
