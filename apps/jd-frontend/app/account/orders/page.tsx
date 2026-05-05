'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountScaffold } from '../components/AccountScaffold';
import { AccountSkeleton } from '../components/AccountSkeleton';
import { formatPrice } from '@/shared/utils/format-price';
import { useAuth } from '@/features/auth/auth.context';
import { useAccount } from '@/features/account/use-account';

export default function AccountOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const { orders, isLoading, error, logout } = useAccount({
    loadUser: false,
    loadOrders: true,
    loadAddresses: false,
  });
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/account/orders');
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
      title="Orders"
      description="Review your recent order history."
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

      {orders.length === 0 ? (
        <p className="text-sm text-ink-muted">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="px-2 py-2 font-medium">Order #</th>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-border/60">
                  <td className="px-2 py-3 font-medium text-ink">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-brand hover:underline"
                    >
                      {order.number}
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-ink-muted">
                    {new Date(order.createdAt).toLocaleString('en-US')}
                  </td>
                  <td className="px-2 py-3 text-ink">{order.status}</td>
                  <td className="px-2 py-3 text-ink">
                    {formatPrice(order.total, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountScaffold>
  );
}
