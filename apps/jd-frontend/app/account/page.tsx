'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Home, CreditCard } from 'lucide-react';
import { AccountScaffold } from './components/AccountScaffold';
import { useAuth } from '@/lib/auth/context';
import { useAccount } from '@/lib/account/useAccount';

export default function AccountOverviewPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const { user, orders, addresses, isLoading, error, logout } = useAccount();
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/account');
    }
  }, [authLoading, isAuthenticated, router]);

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

  if (authLoading || isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-ink-muted">Redirecting to sign in...</p>
      </main>
    );
  }

  return (
    <AccountScaffold
      title="My Account"
      description="Manage your profile, orders, and saved addresses."
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            Orders
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {orders.length}
          </p>
          <Link
            href="/account/orders"
            className="mt-3 inline-block text-sm text-brand hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            Addresses
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {addresses.length}
          </p>
          {addresses.length > 0 && (
            <div className="mt-3 space-y-2">
              {addresses.find(a => a.defaultBilling) && (
                <div className="flex items-start gap-2">
                  <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <p className="text-xs text-ink-muted">
                    {(() => {
                      const a = addresses.find(addr => addr.defaultBilling);
                      if (!a) return null;
                      return (
                        <span>
                          {a.firstname} {a.lastname}
                          <br />
                          {a.street}, {a.city}
                          {a.region ? `, ${a.region}` : ''} {a.postcode}
                        </span>
                      );
                    })()}
                  </p>
                </div>
              )}
              {addresses.find(a => a.defaultShipping) && (
                <div className="flex items-start gap-2">
                  <Home className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                  <p className="text-xs text-ink-muted">
                    {(() => {
                      const a = addresses.find(addr => addr.defaultShipping);
                      if (!a) return null;
                      return (
                        <span>
                          {a.firstname} {a.lastname}
                          <br />
                          {a.street}, {a.city}
                          {a.region ? `, ${a.region}` : ''} {a.postcode}
                        </span>
                      );
                    })()}
                  </p>
                </div>
              )}
              {!addresses.find(a => a.defaultBilling) &&
                !addresses.find(a => a.defaultShipping) && (
                  <p className="text-xs text-ink-muted">
                    No default addresses set
                  </p>
                )}
            </div>
          )}
          {addresses.length === 0 && (
            <p className="mt-3 text-xs text-ink-muted">No addresses saved</p>
          )}
          <Link
            href="/account/addresses"
            className="mt-3 inline-block text-sm text-brand hover:underline"
          >
            Manage addresses
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            Profile
          </p>
          <p className="mt-2 text-base font-semibold text-ink">
            {user
              ? `${user.firstname} ${user.lastname}`.trim() || user.email
              : '—'}
          </p>
          <Link
            href="/account/profile"
            className="mt-3 inline-block text-sm text-brand hover:underline"
          >
            Edit profile
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border p-4">
        <p className="text-sm font-medium text-ink">Signed in as</p>
        <p className="mt-1 text-sm text-ink-muted">
          {user?.email ?? 'Unknown user'}
        </p>
      </div>
    </AccountScaffold>
  );
}
