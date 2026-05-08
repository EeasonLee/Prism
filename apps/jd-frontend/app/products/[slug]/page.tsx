import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { formatPrice } from '@prism/shared';
import type { UnifiedLinkedProduct } from '@/features/product';
import { PageContainer } from '@prism/ui';
import { getProductDetailAggregate } from '@/features/product';
import type {
  ProductReviewListResult,
  ProductReviewSummary,
} from '@/features/product';
import type { ProductQaListResult } from '@/features/product';
import { ProductDetailReviewShell } from './ProductDetailReviewShell';
import { ProductSectionNav } from './ProductSectionNav';
import { UpsellProductsSection } from './UpsellProductsSection';
import { SellingPoints } from './SellingPoints';
import { ProductGuarantees } from './ProductGuarantees';
import { BlogSection } from './BlogSection';
import { ProductSpecifications } from './ProductSpecifications';
import type { ProductSpecificationGroup } from '@/features/product';
import type { ProductDetailPageData } from './product-detail-data';
import { buildPdpSectionNav } from './pdp-section-nav';
import { PDP_FEATURES } from './pdp-features';
import { AddToCartButton } from '@/features/product';
import { resolveImageUrl } from '@prism/shared';
import { Breadcrumb, type BreadcrumbItem } from '@/app/_ui/Breadcrumb';
import { buildBreadcrumbSchema } from '@/shared/utils/seo';

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
      id="section-related-products"
      aria-labelledby="related-products-heading"
      className="py-8 lg:py-10"
    >
      <div className="pt-8">
        <h2 id="related-products-heading" className="heading-3 mb-8 text-ink">
          Related products
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {relatedProducts.map(item => {
            const displayPrice = item.special_price ?? item.price;
            const hasDiscount =
              item.special_price != null && item.special_price < item.price;
            const cardImageUrl =
              resolveImageUrl(item.unified_thumbnail, { size: 350 }) ??
              item.unified_thumbnail;

            return (
              <div
                key={item.sku}
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <Link href={`/products/${item.url_key ?? item.sku}`}>
                  <div className="relative aspect-square bg-surface-muted">
                    {cardImageUrl ? (
                      <OptimizedImage
                        src={cardImageUrl}
                        alt={item.display_name}
                        fill
                        maxDisplayWidth={350}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : null}
                  </div>
                </Link>
                <div className="space-y-2 p-4">
                  <Link
                    href={`/products/${item.url_key ?? item.sku}`}
                    className="block"
                  >
                    <h3 className="line-clamp-2 text-sm font-semibold text-ink">
                      {item.display_name}
                    </h3>
                  </Link>
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
                  <AddToCartButton
                    sku={item.sku}
                    className="btn-primary flex h-9 w-full items-center justify-center gap-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
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

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    ...(product.categories?.[0]
      ? [
          {
            label: product.categories[0].name,
            href: `/categories/${
              product.categories[0].url_key ?? product.categories[0].id
            }`,
          },
        ]
      : []),
    { label: product.display_name },
  ];

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    ...(product.categories?.[0]
      ? [
          {
            name: product.categories[0].name,
            path: `/categories/${
              product.categories[0].url_key ?? product.categories[0].id
            }`,
          },
        ]
      : []),
    { name: product.display_name, path: `/products/${product.sku ?? slug}` },
  ]);

  return (
    <PageContainer className="py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Breadcrumb items={breadcrumbItems} className="mb-5" />
      {sectionNavItems.length > 0 && (
        <ProductSectionNav sections={sectionNavItems} />
      )}
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
        beforeVideos={
          <Suspense fallback={null}>
            <DeferredUpsellProductsSection promise={deferredUpsell} />
          </Suspense>
        }
        videos={cms?.product_videos ?? []}
        recipes={cms?.recipes ?? []}
      />
      <Suspense fallback={null}>
        <DeferredRelatedProductsSection promise={deferredRelated} />
      </Suspense>
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
          <ProductSpecifications groups={specificationGroups} />
        </div>
      )}
      {PDP_FEATURES.fromBlog && (cms?.blog_posts?.length ?? 0) > 0 && (
        <div id="section-blog">
          <BlogSection posts={cms?.blog_posts ?? []} />
        </div>
      )}
    </PageContainer>
  );
}
