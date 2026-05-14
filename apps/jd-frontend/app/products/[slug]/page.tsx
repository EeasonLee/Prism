import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { formatPrice } from '@prism/shared';
import type { UnifiedLinkedProduct } from '@/features/product';
import { PageContainer } from '@prism/ui';
import { getProductDetailAggregate, buildProductUrl } from '@/features/product';
import type {
  ProductReviewListResult,
  ProductReviewSummary,
} from '@/features/product';
import { ProductDetailReviewShell } from './ProductDetailReviewShell';
import { ProductSectionNav } from './ProductSectionNav';
import { UpsellProductsSection } from './UpsellProductsSection';
import { SellingPoints } from './SellingPoints';
import { ProductGuarantees } from './ProductGuarantees';
import { BlogSection } from './BlogSection';
import type { ProductDetailPageData } from './product-detail-data';
import { buildPdpSectionNav } from './pdp-section-nav';
import { PDP_FEATURES } from './pdp-features';
import { AddToCartButton } from '@/features/product';
import { Breadcrumb, type BreadcrumbItem } from '@/app/_ui/Breadcrumb';
import { absoluteUrl, buildBreadcrumbSchema } from '@/shared/utils/seo';
import { resolveImageUrl } from '@/infrastructure/config/image';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface MetadataProduct {
  sku?: string | null;
  url_key?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  short_description?: string | null;
  description?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  unified_thumbnail?: string | null;
  display_name: string;
}

const getProductDetailAggregateSafe = cache(async (sku: string) => {
  return getProductDetailAggregate(sku).catch(() => null);
});

function buildFallbackMetadata(slug: string): Metadata {
  const fallbackPath = `/products/${encodeURIComponent(slug)}`;
  const fallbackUrl = absoluteUrl(fallbackPath);
  return {
    title: 'Product - Joydeem',
    description: 'Product details',
    alternates: { canonical: fallbackPath },
    openGraph: {
      title: 'Product - Joydeem',
      description: 'Product details',
      url: fallbackUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Product - Joydeem',
      description: 'Product details',
    },
  };
}

function cleanDescription(product: MetadataProduct): string {
  const raw =
    product.meta_description?.trim() ||
    (product.short_description ?? product.description ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() ||
    'Product details';
  return raw.length > 160 ? `${raw.slice(0, 159).trimEnd()}…` : raw;
}

function resolveMetadataImage(product: MetadataProduct): string | undefined {
  const imageCandidate =
    product.image_url ?? product.thumbnail_url ?? product.unified_thumbnail;
  const resolvedImageUrl = resolveImageUrl(imageCandidate);
  return resolvedImageUrl ? absoluteUrl(resolvedImageUrl) : undefined;
}

function buildProductMetadata(
  product: MetadataProduct,
  slug: string
): Metadata {
  const path = buildProductUrl({
    url_key: product.url_key ?? null,
    sku: product.sku ?? slug,
    cp_code: null,
  });
  const canonicalUrl = absoluteUrl(path);
  const title = `${
    product.meta_title?.trim() || product.display_name
  } | Joydeem`;
  const description = cleanDescription(product);
  const imageUrl = resolveMetadataImage(product);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: product.display_name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

function getCategorySlug(category: { id: number }): string {
  const categoryWithUrlKey = category as { url_key?: unknown };
  if (
    typeof categoryWithUrlKey.url_key === 'string' &&
    categoryWithUrlKey.url_key.trim()
  ) {
    return categoryWithUrlKey.url_key;
  }
  return String(category.id);
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
                <Link
                  href={buildProductUrl({
                    url_key: item.url_key,
                    sku: item.sku,
                    cp_code: null,
                  })}
                >
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
                    href={buildProductUrl({
                      url_key: item.url_key,
                      sku: item.sku,
                      cp_code: null,
                    })}
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

export async function generateMetadata({
  params,
}: Pick<Props, 'params'>): Promise<Metadata> {
  const { slug } = await params;
  const decodedSku = decodeURIComponent(slug);
  const aggregate = await getProductDetailAggregateSafe(decodedSku);

  if (!aggregate) {
    return buildFallbackMetadata(decodedSku);
  }

  return buildProductMetadata(aggregate.core.product, decodedSku);
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;
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

  let deferredRelated: Promise<UnifiedLinkedProduct[]> = Promise.resolve([]);
  let deferredUpsell: Promise<UnifiedLinkedProduct[]> = Promise.resolve([]);

  const aggregate = await getProductDetailAggregateSafe(decodedSku);

  if (!aggregate) notFound();

  const fetchedProduct = aggregate.core.product;

  const [fetchedReviewsData, fetchedCms, fetchedAddonProducts] =
    await Promise.all([
      aggregate.deferred.reviews,
      aggregate.deferred.cms,
      aggregate.deferred.addonProducts,
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

  // 面包屑：优先使用 URL ?from= 参数匹配的分类（用户实际导航来源），
  // 匹配不到时 fallback 到商品主分类
  const fromSlug = typeof sp.from === 'string' ? sp.from : undefined;
  const fromCategory = fromSlug
    ? product.categories?.find(
        c => getCategorySlug(c) === fromSlug || String(c.id) === fromSlug
      )
    : undefined;
  const breadcrumbCategory = fromCategory ?? product.categories?.[0];

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    ...(breadcrumbCategory
      ? [
          {
            label: breadcrumbCategory.name,
            href: `/categories/${getCategorySlug(breadcrumbCategory)}`,
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
            path: `/categories/${getCategorySlug(product.categories[0])}`,
          },
        ]
      : []),
    {
      name: product.display_name,
      path: buildProductUrl({
        url_key: null,
        sku: product.sku ?? slug,
        cp_code: null,
      }),
    },
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
        addonProducts={fetchedAddonProducts}
        allowSubmit
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
      {PDP_FEATURES.fromBlog && (cms?.blog_posts?.length ?? 0) > 0 && (
        <div id="section-blog">
          <BlogSection posts={cms?.blog_posts ?? []} />
        </div>
      )}
    </PageContainer>
  );
}
