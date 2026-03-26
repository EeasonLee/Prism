import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { fetchDiscoveryResult } from '../../../lib/api/discovery/service';
import { FilterPanel } from '../components/FilterPanel';
import { ProductGrid } from '../components/ProductGrid';
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
            <ProductGrid
              slug={slug}
              initialItems={items}
              initialPagination={pagination}
              searchParams={Object.fromEntries(
                Object.entries(sp).filter(([, v]) => v !== undefined) as [
                  string,
                  string
                ][]
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
