import { notFound } from 'next/navigation';
import { categoryService } from '../../../lib/services/category.service';
import { productService } from '../../../lib/services/product.service';
import { mapProductListItem } from '../../../lib/mappers/product.mapper';
import { mergeProduct } from '../../../lib/api/unified-product';
import { ProductCard } from '../components/ProductCard';
import type { MagentoProduct } from '../../../lib/api/magento/types';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

function toMagentoProduct(
  item: ReturnType<typeof mapProductListItem>
): MagentoProduct {
  return {
    id: 0,
    sku: item.sku,
    url_key: item.url_key,
    name: item.name,
    price: item.price,
    final_price: item.price,
    type_id: 'simple',
    thumbnail_url: item.image,
    image_url: item.image,
    stock_status: item.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
    is_in_stock: item.inStock,
    review_count: 0,
    has_reviews: false,
    category_ids: [],
    categories: [],
    configurable_options: [],
    children: [],
    grouped_items: [],
    bundle_options: [],
    links_purchased_separately: false,
    downloadable_links: [],
    downloadable_samples: [],
    media_gallery: item.image
      ? [{ url: item.image, label: null, position: 0, media_type: null }]
      : [],
  };
}

interface CategoryNode {
  id: number;
  url_key: string;
  children: CategoryNode[];
}

async function getCategoryIdByUrlKey(urlKey: string): Promise<number | null> {
  try {
    const tree = await categoryService.getCategoryTree({ rootId: 2 });

    function findByUrlKey(node: CategoryNode): number | null {
      if (node.url_key === urlKey) return node.id;
      for (const child of node.children || []) {
        const found = findByUrlKey(child);
        if (found) return found;
      }
      return null;
    }

    return findByUrlKey(tree as CategoryNode);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `${slug} - Shop - Joydeem` };
}

export default async function ShopCategoryPage({ params }: Props) {
  const { slug } = await params;

  const categoryId = await getCategoryIdByUrlKey(slug);
  if (!categoryId) notFound();

  const productResponse = await productService
    .getProducts({ categoryId, pageSize: 24 })
    .catch(() => null);

  if (!productResponse) notFound();

  const products = (productResponse.items ?? []).map(item =>
    mergeProduct(toMagentoProduct(mapProductListItem(item)))
  );
  const total = productResponse.total_count ?? products.length;

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
