import { categoryService } from '../../lib/services/category.service';
import { productService } from '../../lib/services/product.service';
import { mapCategoryTree } from '../../lib/mappers/category.mapper';
import { mapProductListItem } from '../../lib/mappers/product.mapper';
import { mergeProduct } from '../../lib/api/unified-product';
import { CategorySidebar } from './components/CategorySidebar';
import { ProductCard } from './components/ProductCard';
import type { MagentoCategoryTree } from '../../lib/api/magento/types';
import type { MagentoProduct } from '../../lib/api/magento/types';

const SHOP_ROOT_CATEGORY_ID = 2;

export const metadata = {
  title: 'Shop - Joydeem',
  description: 'Browse Joydeem kitchen appliances',
};

function toBffCategoryTree(
  node: ReturnType<typeof mapCategoryTree>,
  level = 1
): MagentoCategoryTree {
  return {
    id: node.id,
    name: node.name,
    is_active: true,
    level,
    product_count: 0,
    url_key: node.urlKey || String(node.id),
    children: node.children.map(child => toBffCategoryTree(child, level + 1)),
  };
}

function toMagentoProduct(
  item: ReturnType<typeof mapProductListItem>
): MagentoProduct {
  return {
    id: 0,
    sku: item.sku,
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

export default async function ShopPage() {
  const [rawTree, productResponse] = await Promise.all([
    categoryService
      .getCategoryTree({ rootId: SHOP_ROOT_CATEGORY_ID })
      .catch(() => null),
    productService.getProducts({ pageSize: 24 }).catch(() => null),
  ]);

  const tree = rawTree ? toBffCategoryTree(mapCategoryTree(rawTree)) : null;
  // BFF 直出数据，不做 Strapi enrichment（后续在 BFF 层融合）
  const products = (productResponse?.items ?? []).map(item =>
    mergeProduct(toMagentoProduct(mapProductListItem(item)))
  );
  const total = productResponse?.total_count ?? products.length;

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-[50px]">
      <h1 className="mb-8 text-2xl font-bold text-ink sm:text-3xl">Shop</h1>

      <div className="flex gap-8 lg:gap-12">
        {tree && (
          <aside className="hidden w-52 shrink-0 lg:block">
            <CategorySidebar tree={tree} />
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
