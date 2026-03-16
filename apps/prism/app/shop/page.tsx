import { fetchCategoryTree } from '../../lib/api/magento/catalog';
import { fetchUnifiedProducts } from '../../lib/api/unified-product';
import { CategorySidebar } from './components/CategorySidebar';
import { ProductCard } from './components/ProductCard';

const SHOP_ROOT_CATEGORY_ID = 2;

export const metadata = {
  title: 'Shop - Joydeem',
  description: 'Browse Joydeem kitchen appliances',
};

export default async function ShopPage() {
  const [tree, productList] = await Promise.all([
    fetchCategoryTree().catch(() => null),
    fetchUnifiedProducts({
      categoryId: SHOP_ROOT_CATEGORY_ID,
      pageSize: 24,
      sort: 'created_at',
      order: 'desc',
    }).catch(() => null),
  ]);

  const products = productList?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      <h1 className="mb-8 text-2xl font-bold text-ink sm:text-3xl">Shop</h1>

      <div className="flex gap-8 lg:gap-12">
        {/* 分类侧边栏（桌面端） */}
        {tree && (
          <aside className="hidden w-52 shrink-0 lg:block">
            <CategorySidebar tree={tree} />
          </aside>
        )}

        {/* 商品网格 */}
        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-ink-muted">
                No products found. Please try again later.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-ink-muted">
                {productList?.total_count ?? products.length} products
              </p>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {products.map(product => (
                  <li key={product.id}>
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
