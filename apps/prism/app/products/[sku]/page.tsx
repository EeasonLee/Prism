import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageContainer } from '@prism/ui';
import { fetchUnifiedProductBySku } from '../../../lib/api/unified-product';
import {
  fetchReviewsBySku,
  fetchReviewSummaryBySku,
  type ProductReviewListResult,
  type ProductReviewSummary,
} from '../../../lib/api/strapi/reviews';
import { ProductDetailClient } from './ProductDetailClient';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductSectionNav } from './ProductSectionNav';
import { CrossSellAddons, BundleDeals } from './CrossSellSection';
import { SellingPoints } from './SellingPoints';
import { ProductGuarantees } from './ProductGuarantees';
import { RichDetailSections } from './RichDetailSections';
import { ProductReviews } from './ProductReviews';
import { RecommendedProducts } from './RecommendedProducts';
import { RecipesSection } from './RecipesSection';
import { BlogSection } from './BlogSection';
import { MOCK_PRODUCT_SKU, mockProduct, mockProductExtras } from './mock-data';
import {
  buildPdpSectionNav,
  buildRealProductPageCms,
  type ProductDetailPageData,
} from './product-detail-data';

interface Props {
  params: Promise<{ sku: string }>;
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

function StarRating({
  percentage,
  count,
}: {
  percentage: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={i}
            className="h-4 w-4 text-ink-muted/25"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d={STAR_PATH} />
          </svg>
        ))}
        <div
          className="absolute inset-0 flex gap-0.5 overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              className="h-4 w-4 shrink-0 text-amber-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d={STAR_PATH} />
            </svg>
          ))}
        </div>
      </div>
      <span
        className="text-sm text-ink-muted"
        aria-label={`${(percentage / 20).toFixed(
          1
        )} out of 5, ${count} reviews`}
      >
        {(percentage / 20).toFixed(1)} ({count}{' '}
        {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}

function emptyReviewsResult(): ProductReviewListResult {
  return {
    items: [],
    pagination: {
      page: 1,
      pageSize: 10,
      pageCount: 0,
      total: 0,
    },
  };
}

function emptyReviewSummary(sku: string): ProductReviewSummary {
  return {
    sku,
    average: 0,
    total: 0,
    distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };
}

export async function generateMetadata({ params }: Props) {
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);

  if (decodedSku === MOCK_PRODUCT_SKU) {
    return {
      title: `${mockProduct.seo_title} - Joydeem`,
      description: mockProduct.seo_description,
    };
  }

  const product = await fetchUnifiedProductBySku(decodedSku).catch(() => null);
  return {
    title: product
      ? `${product.seo_title ?? product.display_name} - Joydeem`
      : 'Product - Joydeem',
    description: product?.seo_description ?? product?.display_name,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);

  let data: ProductDetailPageData;
  let reviewSummary: ProductReviewSummary | null = null;
  let reviewList = emptyReviewsResult();

  if (decodedSku === MOCK_PRODUCT_SKU) {
    data = { product: mockProduct, cms: mockProductExtras };
  } else {
    const [fetchedProduct, fetchedSummary, fetchedReviews] = await Promise.all([
      fetchUnifiedProductBySku(decodedSku).catch(() => null),
      fetchReviewSummaryBySku(decodedSku).catch(() =>
        emptyReviewSummary(decodedSku)
      ),
      fetchReviewsBySku(decodedSku, 1, 10).catch(() => emptyReviewsResult()),
    ]);

    if (!fetchedProduct) notFound();

    data = {
      product: fetchedProduct,
      cms: buildRealProductPageCms({
        recipes: fetchedProduct._enriched ? fetchedProduct.recipes : undefined,
        blog_posts: fetchedProduct._enriched
          ? fetchedProduct.blog_posts
          : undefined,
      }),
    };
    reviewSummary = fetchedSummary;
    reviewList = fetchedReviews;
  }

  const { product, cms } = data;
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

  const hasDiscount =
    product.special_price != null && product.special_price < product.price;
  const summaryAverage = reviewSummary?.average ?? 0;
  const summaryTotal = reviewSummary?.total ?? 0;
  const ratingPercentage =
    summaryTotal > 0
      ? Math.max(0, Math.min(100, (summaryAverage / 5) * 100))
      : product.rating_percentage ?? 0;
  const ratingCount =
    summaryTotal > 0 ? summaryTotal : product.review_count ?? 0;

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
              href={`/shop/${product.categories[0].id}`}
              className="transition hover:text-ink"
            >
              {product.categories[0].name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="text-ink">{product.display_name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
        <div className="lg:sticky lg:top-[89px]">
          <ProductImageGallery
            images={galleryImages}
            productName={product.display_name}
          />
        </div>

        <div className="flex flex-col gap-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              SKU: {product.sku}
            </span>
            {product.promotion_label && (
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-brand-foreground">
                {product.promotion_label}
              </span>
            )}
          </div>

          <h1 className="mb-2 text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {product.display_name}
          </h1>

          {product.subtitle && (
            <p className="mb-3 text-base text-ink-muted">{product.subtitle}</p>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {product.is_in_stock ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                In Stock
                {product.stock_qty != null && (
                  <span className="font-normal text-ink-muted">
                    ({product.stock_qty} available)
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Out of Stock
              </span>
            )}
            {ratingCount > 0 && (
              <StarRating percentage={ratingPercentage} count={ratingCount} />
            )}
          </div>

          <div className="mb-4 flex items-baseline gap-3">
            {product.special_price != null && (
              <span className="text-2xl font-bold text-ink">
                ${product.special_price.toFixed(2)}
              </span>
            )}
            {product.price > 0 && (
              <span
                className={
                  hasDiscount
                    ? 'text-base text-ink-muted line-through'
                    : 'text-2xl font-bold text-ink'
                }
              >
                ${product.price.toFixed(2)}
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                Save $
                {(product.price - (product.special_price ?? 0)).toFixed(2)}
              </span>
            )}
          </div>

          {product.promotion_label && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
              <span className="text-sm font-medium text-brand">
                {product.promotion_label}
              </span>
              <span className="text-sm text-ink-muted">
                Save big while offer lasts
              </span>
            </div>
          )}

          {product.short_description_html && (
            <div
              className="prose prose-sm mb-4 max-w-none text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink"
              dangerouslySetInnerHTML={{
                __html: product.short_description_html,
              }}
            />
          )}

          <ProductDetailClient product={product} />

          {(cms?.cross_sell_addons?.length ?? 0) > 0 && (
            <CrossSellAddons
              addons={cms.cross_sell_addons}
              mainProductPrice={product.special_price ?? product.price}
            />
          )}

          {(cms?.bundle_deals?.length ?? 0) > 0 && (
            <BundleDeals
              deals={cms.bundle_deals}
              mainProduct={{
                name: product.display_name,
                image: product.unified_thumbnail ?? product.thumbnail_url ?? '',
                price: product.special_price ?? product.price,
              }}
            />
          )}

          {product.description_html && (
            <div className="mt-6 border-t border-border pt-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">
                Description
              </h2>
              <div
                className="prose prose-sm max-w-none text-ink [&_li]:my-0.5 [&_ul]:pl-4"
                dangerouslySetInnerHTML={{ __html: product.description_html }}
              />
            </div>
          )}
        </div>
      </div>

      {sectionNavItems.length > 0 && (
        <ProductSectionNav sections={sectionNavItems} />
      )}

      {cms &&
        ((cms?.key_points?.length ?? 0) > 0 ||
          (cms?.guarantees?.length ?? 0) > 0) && (
          <div id="section-features">
            {(cms?.key_points?.length ?? 0) > 0 && (
              <SellingPoints points={cms.key_points} />
            )}
            {(cms?.guarantees?.length ?? 0) > 0 && (
              <ProductGuarantees guarantees={cms.guarantees} />
            )}
          </div>
        )}

      {product.product_detail_html && (
        <div id="section-details">
          <div className="my-10 border-t border-border" />
          <section
            aria-labelledby="product-detail-heading"
            className="pb-10 lg:pb-16"
          >
            <h2
              id="product-detail-heading"
              className="heading-3 mb-8 text-center text-ink"
            >
              Product details
            </h2>
            <div
              className="prose prose-sm mx-auto max-w-3xl text-ink [&_li]:my-0.5 [&_ul]:pl-4"
              dangerouslySetInnerHTML={{
                __html: product.product_detail_html,
              }}
            />
          </section>
        </div>
      )}

      {(cms?.detail_sections?.length ?? 0) > 0 &&
        !product.product_detail_html && (
          <div id="section-details">
            <div className="my-10 border-t border-border" />
            <RichDetailSections sections={cms.detail_sections} />
          </div>
        )}

      <div id="section-reviews">
        <div className="border-t border-border" />
        {decodedSku === MOCK_PRODUCT_SKU ? (
          <ProductReviews
            sku={decodedSku}
            mockSummary={mockProductExtras.review_summary}
            mockReviews={mockProductExtras.reviews}
            allowSubmit={false}
          />
        ) : (
          <ProductReviews
            sku={decodedSku}
            summary={reviewSummary ?? emptyReviewSummary(decodedSku)}
            initialReviews={reviewList.items}
            initialPagination={reviewList.pagination}
          />
        )}
      </div>

      {(cms?.recommended_products?.length ?? 0) > 0 && (
        <>
          <div className="border-t border-border" />
          <RecommendedProducts products={cms.recommended_products} />
        </>
      )}

      {(cms?.recipes?.length ?? 0) > 0 && (
        <div id="section-recipes">
          <div className="border-t border-border" />
          <RecipesSection recipes={cms.recipes} />
        </div>
      )}

      {(cms?.blog_posts?.length ?? 0) > 0 && (
        <div id="section-blog">
          <div className="border-t border-border" />
          <BlogSection posts={cms.blog_posts} />
        </div>
      )}
    </PageContainer>
  );
}
