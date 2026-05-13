import Link from 'next/link';
import { OptimizedImage, PageContainer } from '@prism/ui';
import { formatPrice } from '@prism/shared';
import { productQueryFacade, buildProductUrl } from '@/features/product';
import { type ShopSortOption } from '@/features/search';
import {
  gtmViewItemList,
  gtmSelectItem,
  mapDisplayToGtmItem,
} from '@/shared/utils/gtm';
import type { GtmEcommerceItem } from '@/shared/utils/gtm';

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

  let result;
  try {
    result = await productQueryFacade.queryProducts({
      q: q || undefined,
      page: sp.page ? Math.max(1, Number(sp.page)) : 1,
      pageSize: 24,
      sort: (sp.sort as ShopSortOption) || undefined,
      filters: {
        brand: sp.brand,
        priceMin: sp.price_min ? Number(sp.price_min) : undefined,
        priceMax: sp.price_max ? Number(sp.price_max) : undefined,
      },
    });
  } catch {
    result = null;
  }

  const items = result?.items ?? [];
  const pagination = result?.pagination;
  const total = result?.pagination.total ?? 0;

  const listName = q ? `Search: ${q}` : 'Search';
  const listId = q ? `search_${q}` : 'search';

  // GTM: view_item_list
  const gtmItems: GtmEcommerceItem[] = items.map((item, index) =>
    mapDisplayToGtmItem(
      {
        sku: item.sku,
        name: item.displayName ?? item.name ?? item.sku,
        price: item.price?.value ?? 0,
        final_price: item.price?.value ?? 0,
        currency: item.price?.currency,
        categories: item.categories,
        brand: item.brand,
        url_key: item.urlKey,
        image: item.image,
      },
      { index, itemListName: listName, itemListId: listId }
    )
  );
  gtmViewItemList(gtmItems, listName, listId);

  return (
    <PageContainer className="py-10">
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
            {items.map((item, index) => {
              const displayName = item.displayName ?? item.name ?? item.sku;
              const href = buildProductUrl({
                url_key: item.urlKey,
                sku: item.sku,
                cp_code: null,
              });
              return (
                <li key={item.sku}>
                  <Link
                    href={href}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition hover:shadow-md"
                    onClick={() => {
                      gtmSelectItem(
                        mapDisplayToGtmItem(
                          {
                            sku: item.sku,
                            name: displayName,
                            price: item.price?.value ?? 0,
                            final_price: item.price?.value ?? 0,
                            currency: item.price?.currency,
                            categories: item.categories,
                            brand: item.brand,
                            url_key: item.urlKey,
                            image: item.image,
                          },
                          { index, itemListName: listName, itemListId: listId }
                        ),
                        listName,
                        listId
                      );
                    }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-surface">
                      <OptimizedImage
                        src={item.image}
                        alt={displayName}
                        fill
                        maxDisplayWidth={360}
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-contain p-4 transition duration-300 group-hover:scale-105"
                      />
                      {item.promotionLabel && (
                        <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                          {item.promotionLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="mb-2 line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-brand">
                        {displayName}
                      </p>
                      <div className="mt-auto flex items-baseline gap-2">
                        {item.price.value != null && (
                          <span className="text-base font-bold text-ink">
                            {formatPrice(item.price.value, item.price.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
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
    </PageContainer>
  );
}
