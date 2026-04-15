import {
  mapGQLProduct,
  mapLinkedProduct,
  mergeProduct,
  type UnifiedLinkedProduct,
  type UnifiedProduct,
} from '../../unified-product';
import { fetchProductDetailByUrlKeyGQL } from '@/lib/services/magento/product.service';
import { getRelatedProductsBFF } from './related';
import type { ProductStockResponse } from './stock';
import type { RelatedProductItem } from '@/lib/services/search/meilisearch.service';
import {
  fetchReviewSummaryBySku,
  fetchReviewsBySku,
  type ProductReview,
  type ProductReviewPagination,
  type ProductReviewSummary,
} from '@/lib/api/strapi/reviews';
import {
  fetchProductQaBySku,
  type ProductQaListResult,
} from '@/lib/api/strapi/product-qa';
import {
  fetchPdpArticlesBySku,
  fetchPdpProductVideosBySku,
  fetchPdpRecipesBySku,
} from '@/lib/api/strapi/product-content';
import type { ProductPageCms } from '@/app/products/[slug]/product-page-types';

export interface ProductPriceInfo {
  regular: number;
  final: number;
  special: number | null;
  currency: string | null;
}

export interface ProductReviewItem {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string | null;
}

export interface ProductReviewsData {
  summary: ProductReviewSummary;
  items: ProductReview[];
  pagination: ProductReviewPagination;
}

export type ProductDetailCms = Partial<ProductPageCms>;

interface ProductDetailCore {
  product: UnifiedProduct;
  stock: ProductStockResponse;
  price: ProductPriceInfo;
}

interface ProductDetailDeferred {
  related: Promise<UnifiedLinkedProduct[]>;
  upsell: Promise<UnifiedLinkedProduct[]>;
  reviews: Promise<ProductReviewsData>;
  productQa: Promise<ProductQaListResult>;
  cms: Promise<ProductDetailCms | null>;
}

export interface ProductDetailAggregate {
  core: ProductDetailCore;
  deferred: ProductDetailDeferred;
}

export interface ProductDetailApiResponse {
  product: UnifiedProduct;
  stock: ProductStockResponse;
  price: ProductPriceInfo;
  related: UnifiedLinkedProduct[];
  upsell: UnifiedLinkedProduct[];
  reviews: ProductReviewsData;
  productQa: ProductQaListResult;
  cms: ProductDetailCms | null;
}

function buildPriceInfo(product: UnifiedProduct): ProductPriceInfo {
  const regular = product.price;
  const final = product.final_price ?? regular;

  return {
    regular,
    final,
    special: final < regular ? final : null,
    currency: product.currency ?? null,
  };
}

function mapRelatedProducts(
  items: RelatedProductItem[]
): UnifiedLinkedProduct[] {
  return items.map(item => ({
    id: 0,
    sku: item.sku,
    url_key: null,
    name: item.name,
    display_name: item.name,
    price: item.price,
    special_price: null,
    currency: 'USD',
    type_id: 'simple',
    is_in_stock: item.inStock,
    review_count: 0,
    rating_percentage: 0,
    promotion_label: null,
    unified_thumbnail: item.image || null,
  }));
}

function emptyReviewSummary(sku: string): ProductReviewSummary {
  return {
    sku,
    average: 0,
    total: 0,
    distribution: {
      '1': 0,
      '1.5': 0,
      '2': 0,
      '2.5': 0,
      '3': 0,
      '3.5': 0,
      '4': 0,
      '4.5': 0,
      '5': 0,
    },
  };
}

function emptyReviewPagination(): ProductReviewPagination {
  return {
    page: 1,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  };
}

function emptyProductQa(product: UnifiedProduct): ProductQaListResult {
  return {
    productId: product.id,
    sku: product.sku,
    items: [],
    pagination: emptyReviewPagination(),
  };
}

async function getProductReviewsBFF(sku: string): Promise<ProductReviewsData> {
  const [summary, list] = await Promise.all([
    fetchReviewSummaryBySku(sku).catch(() => emptyReviewSummary(sku)),
    fetchReviewsBySku(sku, 1, 10).catch(() => ({
      items: [],
      pagination: emptyReviewPagination(),
    })),
  ]);

  return {
    summary,
    items: list.items,
    pagination: list.pagination,
  };
}

async function getProductCmsBFF(sku: string): Promise<ProductDetailCms | null> {
  const [recipes, blog_posts, product_videos] = await Promise.all([
    fetchPdpRecipesBySku(sku).catch(() => []),
    fetchPdpArticlesBySku(sku).catch(() => []),
    fetchPdpProductVideosBySku(sku).catch(() => []),
  ]);

  if (
    recipes.length === 0 &&
    blog_posts.length === 0 &&
    product_videos.length === 0
  ) {
    return null;
  }

  return { recipes, blog_posts, product_videos };
}

export async function getProductDetailAggregate(
  slugOrSku: string
): Promise<ProductDetailAggregate> {
  const rawProductPromise = fetchProductDetailByUrlKeyGQL(slugOrSku);

  const productPromise = rawProductPromise.then(raw =>
    mergeProduct(mapGQLProduct(raw))
  );

  const stockPromise = productPromise.then<ProductStockResponse>(product => ({
    sku: product.sku,
    inStock: product.stock_status === 'IN_STOCK',
    stockStatus: product.stock_status ?? 'OUT_OF_STOCK',
    qty: null,
    isLowStock: false,
  }));

  const relatedPromise = productPromise
    .then(product => getRelatedProductsBFF(product.sku))
    .then(mapRelatedProducts);
  const upsellPromise = rawProductPromise.then(raw =>
    (raw.upsell_products ?? []).map(mapLinkedProduct)
  );
  const reviewsPromise = productPromise.then(product =>
    getProductReviewsBFF(product.sku)
  );
  const productQaPromise = productPromise.then(product =>
    fetchProductQaBySku(product.id, product.sku, 1, 10).catch(() =>
      emptyProductQa(product)
    )
  );
  const cmsPromise = productPromise.then(product =>
    getProductCmsBFF(product.sku)
  );

  const [product, stock] = await Promise.all([productPromise, stockPromise]);

  return {
    core: {
      product,
      stock,
      price: buildPriceInfo(product),
    },
    deferred: {
      related: relatedPromise,
      upsell: upsellPromise,
      reviews: reviewsPromise,
      productQa: productQaPromise,
      cms: cmsPromise,
    },
  };
}

export async function resolveProductDetailAggregate(
  aggregate: ProductDetailAggregate
): Promise<ProductDetailApiResponse> {
  const [related, upsell, reviews, productQa, cms] = await Promise.all([
    aggregate.deferred.related,
    aggregate.deferred.upsell,
    aggregate.deferred.reviews,
    aggregate.deferred.productQa,
    aggregate.deferred.cms,
  ]);

  return {
    product: aggregate.core.product,
    stock: aggregate.core.stock,
    price: aggregate.core.price,
    related,
    upsell,
    reviews,
    productQa,
    cms,
  };
}

export async function getProductDetailBFF(
  slug: string
): Promise<UnifiedProduct> {
  const aggregate = await getProductDetailAggregate(slug);
  return aggregate.core.product;
}
