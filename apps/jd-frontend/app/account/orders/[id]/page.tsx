'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountScaffold } from '../../components/AccountScaffold';
import { AccountSkeleton } from '../../components/AccountSkeleton';
import { formatPrice } from '@/shared/utils/format-price';
import { useAuth } from '@/features/auth/auth.context';
import { useAccount } from '@/features/account/use-account';
import type { OrderDetail } from '@/features/account/types';

interface ErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ErrorPayload;
    return data.error?.message ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export default function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const { logout } = useAccount({
    loadUser: false,
    loadOrders: false,
    loadAddresses: false,
  });
  const [orderId, setOrderId] = useState<number | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    void params.then(p => {
      const id = Number.parseInt(p.id, 10);
      setOrderId(Number.isNaN(id) || id <= 0 ? null : id);
    });
  }, [params]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/account/orders');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || orderId === null) {
      return;
    }

    let cancelled = false;

    async function fetchOrder() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/account/orders/${orderId}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res));
        }
        const json = (await res.json()) as { order: OrderDetail };
        if (!cancelled) {
          setOrder(json.order ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load order');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, orderId]);

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

  if (orderId === null) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-600">Invalid order ID.</p>
      </main>
    );
  }

  return (
    <AccountScaffold
      title={`Order #${order?.number ?? orderId}`}
      description="Review your order details."
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

      {!order ? (
        <p className="text-sm text-ink-muted">Order not found.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-ink-muted">
                Placed on{' '}
                <span className="font-medium text-ink">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Status:{' '}
                <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  {order.status}
                </span>
              </p>
            </div>
            <Link
              href="/account/orders"
              className="text-sm font-medium text-brand hover:underline"
            >
              Back to orders
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-ink-muted">
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium text-right">Price</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <td className="px-3 py-3 font-medium text-ink">
                      {item.name}
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{item.sku}</td>
                    <td className="px-3 py-3 text-right text-ink">
                      {formatPrice(item.price, order.currency)}
                    </td>
                    <td className="px-3 py-3 text-right text-ink">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-3 text-right text-ink">
                      {formatPrice(item.total, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold text-ink">
                Shipping Address
              </h3>
              <p className="mt-2 text-sm text-ink-muted">
                {order.shippingAddress.firstname}{' '}
                {order.shippingAddress.lastname}
              </p>
              <p className="text-sm text-ink-muted">
                {order.shippingAddress.street}
              </p>
              <p className="text-sm text-ink-muted">
                {order.shippingAddress.city}
                {order.shippingAddress.region
                  ? `, ${order.shippingAddress.region}`
                  : ''}{' '}
                {order.shippingAddress.postcode}
              </p>
              <p className="text-sm text-ink-muted">
                {order.shippingAddress.country}
              </p>
              {order.shippingAddress.telephone && (
                <p className="text-sm text-ink-muted">
                  {order.shippingAddress.telephone}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold text-ink">
                Billing Address
              </h3>
              <p className="mt-2 text-sm text-ink-muted">
                {order.billingAddress.firstname} {order.billingAddress.lastname}
              </p>
              <p className="text-sm text-ink-muted">
                {order.billingAddress.street}
              </p>
              <p className="text-sm text-ink-muted">
                {order.billingAddress.city}
                {order.billingAddress.region
                  ? `, ${order.billingAddress.region}`
                  : ''}{' '}
                {order.billingAddress.postcode}
              </p>
              <p className="text-sm text-ink-muted">
                {order.billingAddress.country}
              </p>
              {order.billingAddress.telephone && (
                <p className="text-sm text-ink-muted">
                  {order.billingAddress.telephone}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-ink">Order Summary</h3>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="text-ink">
                  {formatPrice(order.subtotal, order.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Shipping</dt>
                <dd className="text-ink">
                  {formatPrice(order.shippingAmount, order.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Tax</dt>
                <dd className="text-ink">
                  {formatPrice(order.taxAmount, order.currency)}
                </dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Discount</dt>
                  <dd className="text-ink">
                    -{formatPrice(order.discountAmount, order.currency)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-semibold text-ink">
                  {formatPrice(order.total, order.currency)}
                </dd>
              </div>
            </dl>
            {order.shippingMethod && (
              <p className="mt-3 text-xs text-ink-muted">
                Shipping method: {order.shippingMethod}
              </p>
            )}
            {order.paymentMethod && (
              <p className="text-xs text-ink-muted">
                Payment method: {order.paymentMethod}
              </p>
            )}
          </div>
        </div>
      )}
    </AccountScaffold>
  );
}
