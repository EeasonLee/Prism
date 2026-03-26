import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { fetchDiscoveryResult } from '../../../lib/api/discovery/service';
import { DiscoveryProductCard } from '../components/DiscoveryProductCard';
import { FilterPanel } from '../components/FilterPanel';
import { SortPanel } from '../components/SortPanel';
import type {
  DiscoverySortOption,
  ProductDiscoveryQuery,
} from '../../../lib/api/discovery/types';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    brand?: string;
    price_min?: string;
    price_max?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `${slug} - Shop - Joydeem` };
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const query: ProductDiscoveryQuery = {
    slug,
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
    notFound();
  }

  if (!result) notFound();

  const {
    category,
    items,
    pagination,
    total,
    available_filters: availableFilters,
    sort_options: sortOptions,
  } = result;

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      <h1 className="mb-8 text-2xl font-bold text-ink sm:text-3xl">
        {category?.name ?? slug}
      </h1>

      <div className="flex gap-8">
        {/* Sidebar filters — hidden on mobile */}
        {availableFilters.length > 0 && (
          <aside className="hidden w-56 shrink-0 lg:block">
            <Suspense>
              <FilterPanel
                availableFilters={availableFilters}
                appliedBrand={query.brand}
                appliedPriceMin={query.price_min}
                appliedPriceMax={query.price_max}
              />
            </Suspense>
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {/* Sort bar */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-ink-muted">{total} products</p>
            {sortOptions.length > 0 && (
              <Suspense>
                <SortPanel sortOptions={sortOptions} currentSort={query.sort} />
              </Suspense>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-ink-muted">No products found.</p>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {items.map(item => (
                  <li key={item.sku}>
                    <DiscoveryProductCard item={item} />
                  </li>
                ))}
              </ul>

              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {pagination.page > 1 && (
                    <a
                      href={`/shop/${slug}?page=${pagination.page - 1}`}
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
                      href={`/shop/${slug}?page=${pagination.page + 1}`}
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
      </div>
    </div>
  );
}
