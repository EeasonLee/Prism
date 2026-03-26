import { fetchDiscoveryResult } from '../../lib/api/discovery/service';
import { DiscoveryProductCard } from '../shop/components/DiscoveryProductCard';
import type {
  DiscoverySortOption,
  ProductDiscoveryQuery,
} from '../../lib/api/discovery/types';

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

  const query: ProductDiscoveryQuery = {
    q,
    page: sp.page ? Math.max(1, Number(sp.page)) : 1,
    pageSize: 24,
    brand: sp.brand,
    price_min: sp.price_min ? Number(sp.price_min) : undefined,
    price_max: sp.price_max ? Number(sp.price_max) : undefined,
    sort: (sp.sort as DiscoverySortOption) || undefined,
  };

  let result;
  try {
    result = await fetchDiscoveryResult(query);
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
                <DiscoveryProductCard item={item} />
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
