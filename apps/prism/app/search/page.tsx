import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/format-price';
import { fetchProductSearchResult } from './lib/service';
import type { SearchSortOption, ProductSearchQuery } from './types';

interface Props {
  searchParams: Promise<{
    q?: string;
    page?: string;
    brand?: string;
    price_min?: string;
    price_max?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  return {
    title: sp.q ? `Search: ${sp.q} - Joydeem` : 'Search - Joydeem',
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';

  const query: ProductSearchQuery = {
    q,
    page: sp.page ? Math.max(1, Number(sp.page)) : 1,
    pageSize: 24,
    brand: sp.brand,
    price_min: sp.price_min ? Number(sp.price_min) : undefined,
    price_max: sp.price_max ? Number(sp.price_max) : undefined,
    sort: (sp.sort as SearchSortOption) || undefined,
  };

  let result;
  try {
    result = await fetchProductSearchResult(query);
  } catch {
    result = null;
  }

  const items = result?.items ?? [];
  const pagination = result?.pagination;
  const total = result?.total ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      <h1 className="mb-2 text-2xl font-bold text-ink sm:text-3xl">
        {q ? `Results for "${q}"` : 'Search'}
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-ink-muted">
            {q
              ? `No products found for "${q}".`
              : 'Enter a search term to find products.'}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-muted">{total} products</p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {items.map(item => (
              <li key={item.sku}>
                <Link
                  href={item.href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden bg-surface">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-contain p-4 transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-ink-muted/30">
                        <svg
                          className="h-12 w-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    {item.promotion_label && (
                      <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                        {item.promotion_label}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="mb-2 line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-brand">
                      {item.name}
                    </p>
                    <div className="mt-auto flex items-baseline gap-2">
                      {item.price != null && (
                        <span className="text-base font-bold text-ink">
                          {formatPrice(item.price, item.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {pagination.page > 1 && (
                <a
                  href={`/search?q=${encodeURIComponent(q)}&page=${
                    pagination.page - 1
                  }`}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-surface"
                >
                  Previous
                </a>
              )}
              <span className="text-sm text-ink-muted">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {pagination.page < pagination.totalPages && (
                <a
                  href={`/search?q=${encodeURIComponent(q)}&page=${
                    pagination.page + 1
                  }`}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-surface"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
