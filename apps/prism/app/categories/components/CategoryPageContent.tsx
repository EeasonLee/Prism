import Link from 'next/link';
import { Suspense } from 'react';
import { Skeleton } from '@prism/ui';
import { FilterPanel } from '../../shop/components/FilterPanel';
import {
  SortPanel,
  type ShopSortOption,
} from '../../shop/components/SortPanel';
import {
  searchShopProducts,
  type ShopSearchResult,
} from '../../shop/lib/meilisearch';
import type {
  CategoryContext,
  CategoryTreeNode,
} from '../../../lib/api/bff/category/types';
import { MobileFilterButton } from './MobileFilterButton';
import { CategoryProductGrid } from './CategoryProductGrid';
import { CategoryProductGridSkeleton } from './CategoryProductGridSkeleton';
import { CategoryFilterSkeleton } from './CategoryFilterSkeleton';

interface CategoryPageContentProps {
  slug: string;
  currentCategory: CategoryContext;
  categoryTree: CategoryTreeNode[];
  searchParams: {
    page?: string;
    brand?: string;
    size?: string;
    price_min?: string;
    price_max?: string;
    sort?: string;
  };
}

// Async sub-components for Suspense streaming -----------------------------

async function CategoryFilterSidebar({
  searchPromise,
  sp,
}: {
  searchPromise: Promise<ShopSearchResult | null>;
  sp: CategoryPageContentProps['searchParams'];
}) {
  const result = await searchPromise;
  const availableFilters = result?.availableFilters ?? [];

  return (
    <FilterPanel
      availableFilters={availableFilters}
      appliedBrand={sp.brand}
      appliedSize={sp.size}
      appliedPriceMin={sp.price_min ? Number(sp.price_min) : undefined}
      appliedPriceMax={sp.price_max ? Number(sp.price_max) : undefined}
    />
  );
}

async function CategoryProductList({
  searchPromise,
  slug,
  sp,
}: {
  searchPromise: Promise<ShopSearchResult | null>;
  slug: string;
  sp: CategoryPageContentProps['searchParams'];
}) {
  const result = await searchPromise;
  const products = result?.items ?? [];
  const total = result?.pagination.total ?? products.length;
  const pagination = result?.pagination ?? {
    page: 1,
    pageSize: 24,
    total: products.length,
    totalPages: 1,
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-muted">{total} products</p>
        <div className="hidden sm:block">
          <SortPanel
            sortOptions={['featured', 'price_asc', 'price_desc', 'newest']}
            currentSort={(sp.sort as ShopSortOption) || undefined}
          />
        </div>
      </div>

      {/* Mobile sort bar */}
      <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
        <SortPanel
          sortOptions={['featured', 'price_asc', 'price_desc', 'newest']}
          currentSort={(sp.sort as ShopSortOption) || undefined}
        />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-ink-muted">No products found.</p>
        </div>
      ) : (
        <CategoryProductGrid
          slug={slug}
          initialProducts={products}
          initialPagination={pagination}
          filters={{
            brand: sp.brand,
            size: sp.size,
            priceMin: sp.price_min ? Number(sp.price_min) : undefined,
            priceMax: sp.price_max ? Number(sp.price_max) : undefined,
            sort: (sp.sort as ShopSortOption) || undefined,
          }}
        />
      )}
    </>
  );
}

async function CategoryMobileFilters({
  searchPromise,
  sp,
}: {
  searchPromise: Promise<ShopSearchResult | null>;
  sp: CategoryPageContentProps['searchParams'];
}) {
  const result = await searchPromise;
  const availableFilters = result?.availableFilters ?? [];

  return (
    <MobileFilterButton
      availableFilters={availableFilters}
      appliedBrand={sp.brand}
      appliedSize={sp.size}
      appliedPriceMin={sp.price_min ? Number(sp.price_min) : undefined}
      appliedPriceMax={sp.price_max ? Number(sp.price_max) : undefined}
      currentSort={(sp.sort as ShopSortOption) || undefined}
    />
  );
}

// Main component ----------------------------------------------------------

export function CategoryPageContent({
  slug: _slug,
  currentCategory,
  searchParams: sp,
}: CategoryPageContentProps) {
  const searchPromise = searchShopProducts({
    category: currentCategory.name,
    categoryId: currentCategory.id,
    page: sp.page ? Math.max(1, Number(sp.page)) : 1,
    pageSize: 24,
    brand: sp.brand,
    size: sp.size,
    priceMin: sp.price_min ? Number(sp.price_min) : undefined,
    priceMax: sp.price_max ? Number(sp.price_max) : undefined,
    sort: (sp.sort as ShopSortOption) || undefined,
    facets: ['brand', 'size'],
  }).catch(() => null);

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 pb-[calc(var(--mobile-tabbar-height)+var(--mobile-safe-area-bottom)+6rem)] sm:px-6 lg:px-[50px] lg:pb-10">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <li>
            <Link href="/" className="hover:text-ink hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="hover:text-ink hover:underline">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {currentCategory.name}
          </li>
        </ol>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-ink sm:text-3xl">
        {currentCategory.name}
      </h1>

      <div className="flex gap-8 lg:gap-12">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <Suspense fallback={<CategoryFilterSkeleton />}>
              <CategoryFilterSidebar searchPromise={searchPromise} sp={sp} />
            </Suspense>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Suspense
            fallback={
              <>
                <div className="mb-4 flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <div className="hidden sm:block">
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
                <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
                  <Skeleton className="h-8 w-full" />
                </div>
                <CategoryProductGridSkeleton count={8} />
              </>
            }
          >
            <CategoryProductList
              searchPromise={searchPromise}
              slug={currentCategory.name}
              sp={sp}
            />
          </Suspense>
        </div>
      </div>

      {/* Mobile floating filter button */}
      <Suspense fallback={null}>
        <CategoryMobileFilters searchPromise={searchPromise} sp={sp} />
      </Suspense>
    </div>
  );
}
