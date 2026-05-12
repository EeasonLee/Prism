'use client';

import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Heart, Trash2, Loader2 } from 'lucide-react';
import { formatPrice } from '@prism/shared';
import { useAccount } from '@/features/account/use-account';
import type { WishlistItem } from '@/features/account/types';
import { buildProductUrl } from '@/features/product';

export default function WishlistPage() {
  const { getWishlist, removeFromWishlist } = useAccount({
    loadUser: false,
    loadOrders: false,
    loadAddresses: false,
  });
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWishlist();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [getWishlist]);

  useEffect(() => {
    void loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try {
      await removeFromWishlist(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      setTimeout(() => setError(null), 3000);
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
        <h1 className="heading-2 text-ink">My Wishlist</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Products you have saved for later.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-xl bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
      <h1 className="heading-2 text-ink">My Wishlist</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Products you have saved for later.
      </p>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="mb-4 h-12 w-12 text-ink-faint" />
          <p className="text-base font-medium text-ink">
            Your wishlist is empty
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Save items you love and view them here.
          </p>
          <Link
            href="/categories"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand/90"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <li
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-surface transition hover:shadow-card"
            >
              <Link
                href={buildProductUrl({
                  url_key: item.urlKey,
                  sku: item.sku,
                  cp_code: null,
                })}
                className="block"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-background">
                  <OptimizedImage
                    src={item.thumbnail}
                    alt={item.name}
                    fill
                    maxDisplayWidth={480}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </Link>
              <div className="p-4">
                <Link
                  href={buildProductUrl({
                    url_key: item.urlKey,
                    sku: item.sku,
                    cp_code: null,
                  })}
                  className="block"
                >
                  <h3 className="line-clamp-2 text-sm font-semibold text-ink">
                    {item.name}
                  </h3>
                </Link>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="font-semibold text-ink">
                    {formatPrice(item.price, item.currency)}
                  </span>
                  {item.originalPrice != null && (
                    <span className="text-ink-faint line-through">
                      {formatPrice(item.originalPrice, item.currency)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemove(item.id)}
                  disabled={removingId === item.id}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {removingId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
