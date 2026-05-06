import { ProductCard, productQueryFacade } from '@/features/product';
import { FilterPanel } from '@/features/search';
import { SortPanel, type ShopSortOption } from '@/features/search';

export const metadata = {
  title: 'Shop - Joydeem',
  description: 'Browse Joydeem kitchen appliances',
};

interface Props {
  searchParams: Promise<{
    q?: string;
    page?: string;
    brand?: string;
    size?: string;
    category?: string;
    price_min?: string;
    price_max?: string;
    sort?: string;
  }>;
}

function buildPageHref(
  basePath: string,
  sp: Record<string, string | undefined>,
  page: number
) {
  const params = new URLSearchParams();
  if (sp.q) params.set('q', sp.q);
  if (sp.brand) params.set('brand', sp.brand);
  if (sp.size) params.set('size', sp.size);
  if (sp.category) params.set('category', sp.category);
  if (sp.price_min) params.set('price_min', sp.price_min);
  if (sp.price_max) params.set('price_max', sp.price_max);
  if (sp.sort) params.set('sort', sp.sort);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;

  const result = await productQueryFacade
    .queryProducts({
      q: sp.q?.trim() || undefined,
      page: sp.page ? Math.max(1, Number(sp.page)) : 1,
      pageSize: 24,
      sort: (sp.sort as ShopSortOption) || undefined,
      filters: {
        brand: sp.brand,
        size: sp.size,
        category: sp.category,
        priceMin: sp.price_min ? Number(sp.price_min) : undefined,
        priceMax: sp.price_max ? Number(sp.price_max) : undefined,
      },
    })
    .catch(() => null);

  const products = result?.items ?? [];
  const total = result?.pagination.total ?? products.length;
  const pagination = result?.pagination;
  const availableFilters = result?.availableFilters ?? [];

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      <h1 className="mb-8 text-2xl font-bold text-ink sm:text-3xl">Shop</h1>

      <div className="flex gap-8 lg:gap-12">
        <aside className="hidden w-56 shrink-0 lg:block">
          <FilterPanel
            availableFilters={availableFilters}
            appliedBrand={sp.brand}
            appliedSize={sp.size}
            appliedCategory={sp.category}
            appliedPriceMin={sp.price_min ? Number(sp.price_min) : undefined}
            appliedPriceMax={sp.price_max ? Number(sp.price_max) : undefined}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-ink-muted">{total} products</p>
            <SortPanel
              sortOptions={['featured', 'price_asc', 'price_desc', 'newest']}
              currentSort={(sp.sort as ShopSortOption) || undefined}
            />
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-ink-muted">
                No products found. Please try again later.
              </p>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {products.map(product => (
                  <li key={product.sku}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {pagination.page > 1 && (
                    <a
                      href={buildPageHref('/shop', sp, pagination.page - 1)}
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
                      href={buildPageHref('/shop', sp, pagination.page + 1)}
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
