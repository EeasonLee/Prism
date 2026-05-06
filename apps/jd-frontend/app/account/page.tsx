'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Home, CreditCard } from 'lucide-react';
import { AccountScaffold } from './components/AccountScaffold';
import { AccountSkeleton } from './components/AccountSkeleton';
import { useAuth } from '@/features/auth';
import { useAccount } from '@/features/account/use-account';

export default function AccountOverviewPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const {
    user,
    orders,
    addresses,
    wishlist,
    isLoading,
    error,
    logout,
    getDefaultAddresses,
  } = useAccount();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [defaultAddresses, setDefaultAddresses] = useState<{
    billing: (typeof addresses)[number] | null;
    shipping: (typeof addresses)[number] | null;
  }>({ billing: null, shipping: null });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/account');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      getDefaultAddresses()
        .then(data => setDefaultAddresses(data))
        .catch(() => setDefaultAddresses({ billing: null, shipping: null }));
    }
  }, [isAuthenticated, authLoading, getDefaultAddresses]);

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              {defaultAddresses.billing && (
                <div className="flex items-start gap-2">
                  <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <p className="text-xs text-ink-muted">
                    <span>
                      {defaultAddresses.billing.firstname}{' '}
                      {defaultAddresses.billing.lastname}
                      <br />
                      {defaultAddresses.billing.street},{' '}
                      {defaultAddresses.billing.city}
                      {defaultAddresses.billing.region
                        ? `, ${defaultAddresses.billing.region}`
                        : ''}{' '}
                      {defaultAddresses.billing.postcode}
                    </span>
                  </p>
                </div>
              )}
              {defaultAddresses.shipping && (
                <div className="flex items-start gap-2">
                  <Home className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                  <p className="text-xs text-ink-muted">
                    <span>
                      {defaultAddresses.shipping.firstname}{' '}
                      {defaultAddresses.shipping.lastname}
                      <br />
                      {defaultAddresses.shipping.street},{' '}
                      {defaultAddresses.shipping.city}
                      {defaultAddresses.shipping.region
                        ? `, ${defaultAddresses.shipping.region}`
                        : ''}{' '}
                      {defaultAddresses.shipping.postcode}
                    </span>
                  </p>
                </div>
              )}
              {!defaultAddresses.billing && !defaultAddresses.shipping && (
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
            Wishlist
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {wishlist.length}
          </p>
          <Link
            href="/account/wishlist"
            className="mt-3 inline-block text-sm text-brand hover:underline"
          >
            View wishlist
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
