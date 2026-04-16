import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { formatPrice } from '@/lib/format-price';
import type { UnifiedLinkedProduct } from '../../../lib/api/unified-product';
import { PageContainer } from '@prism/ui';
import { getProductDetailAggregate } from '../../../lib/api/bff/product/detail';
import type {
  ProductReviewListResult,
  ProductReviewSummary,
} from '../../../lib/api/strapi/reviews';
import type { ProductQaListResult } from '../../../lib/api/strapi/product-qa';
import { ProductDetailReviewShell } from './ProductDetailReviewShell';
import { ProductSectionNav } from './ProductSectionNav';
import { UpsellProductsSection } from './UpsellProductsSection';
import { SellingPoints } from './SellingPoints';
import { ProductGuarantees } from './ProductGuarantees';
import { RecipesSection } from './RecipesSection';
import { BlogSection } from './BlogSection';
import { ProductSpecifications } from './ProductSpecifications';
import type { ProductSpecificationGroup } from '../../../lib/api/strapi/product-enrichment';
import type { ProductDetailPageData } from './product-detail-data';
import { buildPdpSectionNav } from './pdp-section-nav';
import { PDP_FEATURES } from './pdp-features';

interface Props {
  params: Promise<{ slug: string }>;
}

function getSpecificationGroups(product: {
  specifications: unknown;
}): ProductSpecificationGroup[] {
  const raw = product.specifications;
  return Array.isArray(raw) ? (raw as ProductSpecificationGroup[]) : [];
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

async function DeferredRelatedProductsSection({
  promise,
}: {
  promise: Promise<UnifiedLinkedProduct[]>;
}) {
  const relatedProducts = await promise;

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="related-products-heading"
      className="py-8 lg:py-10"
    >
      <div className="border-t border-border pt-8">
        <h2 id="related-products-heading" className="heading-4 mb-6 text-ink">
          Related products
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {relatedProducts.map(item => {
            const displayPrice = item.special_price ?? item.price;
            const hasDiscount =
              item.special_price != null && item.special_price < item.price;

            return (
              <Link
                key={item.sku}
                href={`/products/${item.url_key ?? item.sku}`}
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-ink">
                    {item.display_name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-ink">
                      {formatPrice(displayPrice, item.currency)}
                    </span>
                    {hasDiscount ? (
                      <span className="text-ink-faint line-through">
                        {formatPrice(item.price, item.currency)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

async function DeferredUpsellProductsSection({
  promise,
}: {
  promise: Promise<UnifiedLinkedProduct[]>;
}) {
  const upsellProducts = await promise;
  return <UpsellProductsSection initialProducts={upsellProducts} />;
}

export async function generateMetadata() {
  return {
    title: 'Product - Joydeem',
    description: 'Product details',
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const decodedSku = decodeURIComponent(slug);

  let reviewSummary: ProductReviewSummary | null = null;
  let reviewList: ProductReviewListResult = {
    items: [],
    pagination: {
      page: 1,
      pageSize: 10,
      pageCount: 0,
      total: 0,
    },
  };

  let initialProductQa: ProductQaListResult = {
    productId: 0,
    sku: decodedSku,
    items: [],
    pagination: {
      page: 1,
      pageSize: 10,
      pageCount: 0,
      total: 0,
    },
  };

  let deferredRelated: Promise<UnifiedLinkedProduct[]> = Promise.resolve([]);
  let deferredUpsell: Promise<UnifiedLinkedProduct[]> = Promise.resolve([]);

  const aggregate = await getProductDetailAggregate(decodedSku).catch(
    () => null
  );

  if (!aggregate) notFound();

  const fetchedProduct = aggregate.core.product;

  const [fetchedReviewsData, fetchedProductQa, fetchedCms] = await Promise.all([
    aggregate.deferred.reviews,
    aggregate.deferred.productQa,
    aggregate.deferred.cms,
  ]);

  const data: ProductDetailPageData = {
    product: fetchedProduct,
    cms: fetchedCms,
  };
  reviewSummary = fetchedReviewsData.summary;
  reviewList = {
    items: fetchedReviewsData.items,
    pagination: fetchedReviewsData.pagination,
  };
  initialProductQa = fetchedProductQa;
  deferredRelated = aggregate.deferred.related;
  deferredUpsell = aggregate.deferred.upsell;

  const { product, cms } = data;
  const reviewSku = product.sku;
  const sectionNavItems = buildPdpSectionNav(cms, product, reviewSummary);

  const galleryImages =
    product.unified_images.length > 0
      ? product.unified_images
      : product.media_gallery
          ?.filter(e => e.media_type === 'image')
          .map(e => ({
            url: e.url,
            alt: e.label ?? product.display_name,
          })) ??
        product.media_gallery_entries
          ?.filter(e => !e.disabled)
          .map(e => ({
            url: e.url,
            alt: e.label ?? product.display_name,
          })) ??
        [];

  const summaryAverage = reviewSummary?.average ?? 0;
  const summaryTotal = reviewSummary?.total ?? 0;
  const ratingPercentage =
    summaryTotal > 0
      ? Math.max(0, Math.min(100, (summaryAverage / 5) * 100))
      : product.rating_percentage ?? 0;
  const ratingCount =
    summaryTotal > 0 ? summaryTotal : product.review_count ?? 0;

  const specificationGroups = getSpecificationGroups(product);

  return (
    <PageContainer className="py-6">
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex items-center gap-2 text-sm text-ink-muted"
      >
        <Link href="/shop" className="transition hover:text-ink">
          Shop
        </Link>
        <span aria-hidden="true">/</span>
        {product.categories?.[0] && (
          <>
            <Link
              href={`/categories/${product.categories[0].url_key}`}
              className="transition hover:text-ink"
            >
              {product.categories[0].name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="text-ink">{product.display_name}</span>
      </nav>
      <ProductDetailReviewShell
        product={product}
        galleryImages={galleryImages}
        ratingPercentage={ratingPercentage}
        ratingCount={ratingCount}
        reviewSku={reviewSku}
        summary={reviewSummary ?? emptyReviewSummary(reviewSku)}
        initialReviews={reviewList.items}
        initialPagination={reviewList.pagination}
        allowSubmit
        initialProductQa={initialProductQa}
        videos={cms?.product_videos ?? []}
      />
      <Suspense fallback={null}>
        <DeferredRelatedProductsSection promise={deferredRelated} />
      </Suspense>
      {sectionNavItems.length > 0 && (
        <ProductSectionNav sections={sectionNavItems} />
      )}
      {cms &&
        ((cms?.key_points?.length ?? 0) > 0 ||
          (cms?.guarantees?.length ?? 0) > 0) && (
          <div id="section-features">
            {(cms?.key_points?.length ?? 0) > 0 && (
              <SellingPoints points={cms.key_points ?? []} />
            )}
            {(cms?.guarantees?.length ?? 0) > 0 && (
              <ProductGuarantees guarantees={cms.guarantees ?? []} />
            )}
          </div>
        )}
      {specificationGroups.length > 0 && (
        <div id="section-specifications">
          <div className="border-t border-border" />
          <ProductSpecifications groups={specificationGroups} />
        </div>
      )}
      {(cms?.recipes?.length ?? 0) > 0 && (
        <div id="section-recipes">
          <div className="border-t border-border" />
          <RecipesSection recipes={cms?.recipes ?? []} />
        </div>
      )}
      {PDP_FEATURES.fromBlog && (cms?.blog_posts?.length ?? 0) > 0 && (
        <div id="section-blog">
          <div className="border-t border-border" />
          <BlogSection posts={cms?.blog_posts ?? []} />
        </div>
      )}
      <Suspense fallback={null}>
        <DeferredUpsellProductsSection promise={deferredUpsell} />
      </Suspense>
    </PageContainer>
  );
}
