'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@prism/shared';
import { useAuth } from '@/features/auth';
import { useAccount } from '@/features/account/use-account';
import { AccountSkeleton } from './components/AccountSkeleton';

const ACCOUNT_LINKS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const { logout } = useAccount({
    loadUser: false,
    loadOrders: false,
    loadAddresses: false,
  });
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [authLoading, isAuthenticated, router, pathname]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await logout();
      await refreshSession();
      router.replace('/login');
    } finally {
      setLogoutLoading(false);
    }
  }, [logout, refreshSession, router]);

  if (authLoading) {
    return <AccountSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-ink-muted">Redirecting to sign in...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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

          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-surface hover:text-ink disabled:opacity-60"
          >
            {logoutLoading ? 'Signing out...' : 'Sign out'}
          </button>
        </aside>

        <section className="min-h-0">{children}</section>
      </div>
    </main>
  );
}
