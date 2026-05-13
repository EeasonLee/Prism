'use client';

import Link from 'next/link';
import { useAccount } from '@/features/account/use-account';
import { formatPrice } from '@prism/shared';

export default function AccountOrdersPage() {
  const { orders, isLoading, error } = useAccount({
    loadUser: false,
    loadOrders: true,
    loadAddresses: false,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
        <h1 className="heading-2 text-ink">Orders</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Review your recent order history.
        </p>
        <div className="mt-6 h-64 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
      <h1 className="heading-2 text-ink">Orders</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Review your recent order history.
      </p>
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
    </div>
  );
}
