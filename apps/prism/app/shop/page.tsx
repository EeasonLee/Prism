import { getCategoryListPageData } from '../../lib/api/bff/category/list';
import { CategorySidebar } from './components/CategorySidebar';
import { ProductCard } from './components/ProductCard';

export const metadata = {
  title: 'Shop - Joydeem',
  description: 'Browse Joydeem kitchen appliances',
};

export default async function ShopPage() {
  const data = await getCategoryListPageData({ page: 1, pageSize: 24 }).catch(
    () => null
  );

  const products = data?.products ?? [];
  const total = data?.pagination.total ?? products.length;

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      <h1 className="mb-8 text-2xl font-bold text-ink sm:text-3xl">Shop</h1>

      <div className="flex gap-8 lg:gap-12">
        {(data?.categoryTree?.length ?? 0) > 0 && (
          <aside className="hidden w-52 shrink-0 lg:block">
            <CategorySidebar categories={data?.categoryTree ?? []} />
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-ink-muted">
                No products found. Please try again later.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-ink-muted">{total} products</p>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {products.map(product => (
                  <li key={product.sku}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
