import { notFound } from 'next/navigation';
import {
  fetchCategoryById,
  fetchCategoryTree,
  fetchProducts,
} from '../../../lib/api/magento/catalog';
import { CategorySidebar } from '../components/CategorySidebar';
import { ProductCard } from '../components/ProductCard';

interface Props {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { categoryId } = await params;
  const id = Number(categoryId);
  if (isNaN(id)) return {};
  const category = await fetchCategoryById(id).catch(() => null);
  return {
    title: category ? `${category.name} - Shop - Joydeem` : 'Shop - Joydeem',
  };
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: Props) {
  const { categoryId } = await params;
  const { page: pageStr } = await searchParams;
  const categoryIdNum = Number(categoryId);

  if (isNaN(categoryIdNum)) notFound();

  const page = Math.max(1, Number(pageStr ?? '1'));

  const [tree, category, productList] = await Promise.all([
    fetchCategoryTree().catch(() => null),
    fetchCategoryById(categoryIdNum).catch(() => null),
    fetchProducts({
      categoryId: categoryIdNum,
      page,
      pageSize: 24,
      sort: 'position',
      order: 'asc',
    }).catch(() => null),
  ]);

  if (!category) notFound();

  const products = productList?.items ?? [];
  const totalCount = productList?.total_count ?? 0;
  const pageSize = 24;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      <h1 className="mb-8 text-2xl font-bold text-ink sm:text-3xl">
        {category.name}
      </h1>

      <div className="flex gap-8 lg:gap-12">
        {/* 分类侧边栏 */}
        {tree && (
          <aside className="hidden w-52 shrink-0 lg:block">
            <CategorySidebar tree={tree} activeCategoryId={categoryIdNum} />
          </aside>
        )}

        {/* 商品网格 */}
        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-ink-muted">
                No products in this category yet.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-ink-muted">
                {totalCount} products
              </p>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {products.map(product => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <a
                      href={`/shop/${categoryId}?page=${page - 1}`}
                      className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-surface"
                    >
                      Previous
                    </a>
                  )}
                  <span className="text-sm text-ink-muted">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <a
                      href={`/shop/${categoryId}?page=${page + 1}`}
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
