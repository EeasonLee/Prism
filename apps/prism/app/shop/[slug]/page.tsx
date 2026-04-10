import { notFound } from 'next/navigation';
import {
  getCategoryContextBySlug,
  getCategoryListPageData,
} from '../../../lib/api/bff/category/list';
import { ProductCard } from '../components/ProductCard';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getCategoryContextBySlug(slug).catch(() => null);
  return { title: `${data?.currentCategory?.name ?? slug} - Shop - Joydeem` };
}

export default async function ShopCategoryPage({ params }: Props) {
  const { slug } = await params;

  const data = await getCategoryListPageData({
    slug,
    page: 1,
    pageSize: 24,
  }).catch(() => null);
  if (!data) notFound();

  const products = data.products;
  const total = data.pagination.total;

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      <h1 className="mb-8 text-2xl font-bold text-ink sm:text-3xl">{slug}</h1>

      <div className="min-w-0 flex-1">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-ink-muted">No products found.</p>
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
  );
}
