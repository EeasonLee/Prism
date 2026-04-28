'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@prism/shared';

interface AccountScaffoldProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onLogout?: () => Promise<void>;
  logoutLoading?: boolean;
}

const ACCOUNT_LINKS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
];

export function AccountScaffold({
  title,
  description,
  children,
  onLogout,
  logoutLoading = false,
}: AccountScaffoldProps) {
  const pathname = usePathname();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="heading-2 text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-xl border border-border bg-background p-3">
          <nav aria-label="Account navigation" className="space-y-1">
            {ACCOUNT_LINKS.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block rounded-lg px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-brand/10 text-brand'
                      : 'text-ink-muted hover:bg-surface hover:text-ink'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {onLogout && (
            <button
              type="button"
              onClick={() => void onLogout()}
              disabled={logoutLoading}
              className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-surface hover:text-ink disabled:opacity-60"
            >
              {logoutLoading ? 'Signing out...' : 'Sign out'}
            </button>
          )}
        </aside>

        <section className="rounded-xl border border-border bg-background p-5 sm:p-6">
          {children}
        </section>
      </div>
    </main>
  );
}
