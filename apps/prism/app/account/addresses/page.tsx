'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountScaffold } from '../components/AccountScaffold';
import { useAuth } from '@/lib/auth/context';
import { useAccount } from '@/lib/account/useAccount';

export default function AccountAddressesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const { addresses, isLoading, error, logout } = useAccount({
    loadUser: false,
    loadOrders: false,
    loadAddresses: true,
  });
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/account/addresses');
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
      title="Addresses"
      description="Your saved shipping and billing addresses."
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

      {addresses.length === 0 ? (
        <p className="text-sm text-ink-muted">No addresses found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map(address => (
            <article
              key={`${address.id}-${address.street}`}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="font-medium text-ink">
                {address.firstname} {address.lastname}
              </p>
              <p className="mt-2 text-sm text-ink-muted">{address.street}</p>
              <p className="text-sm text-ink-muted">
                {address.city}, {address.country}
              </p>
            </article>
          ))}
        </div>
      )}
    </AccountScaffold>
  );
}
