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
import { ProductDetailContent } from './ProductDetailContent';
import { ProductSectionNav } from './ProductSectionNav';
import { SellingPoints } from './SellingPoints';
import { ProductGuarantees } from './ProductGuarantees';
import { ProductReviews } from './ProductReviews';
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

export async function generateMetadata({ params }: Props) {
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);

  if (decodedSku === MOCK_PRODUCT_SKU) {
    return {
      title: `${mockProduct.seo_title} - Joydeem`,
      description: mockProduct.seo_description,
    };
  }

  return {
    title: 'Product - Joydeem',
    description: 'Product details',
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);

  let data: ProductDetailPageData;
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

  if (decodedSku === MOCK_PRODUCT_SKU) {
    data = { product: mockProduct, cms: mockProductExtras };
  } else {
    const [fetchedProduct, fetchedSummary, fetchedReviews] = await Promise.all([
      fetchUnifiedProductBySku(decodedSku).catch(() => null),
      fetchReviewSummaryBySku(decodedSku).catch(() => ({
        sku: decodedSku,
        average: 0,
        total: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      })),
      fetchReviewsBySku(decodedSku, 1, 10).catch(() => ({
        items: [],
        pagination: {
          page: 1,
          pageSize: 10,
          pageCount: 0,
          total: 0,
        },
      })),
    ]);

    if (!fetchedProduct) notFound();

    data = {
      product: fetchedProduct,
      cms: buildRealProductPageCms(fetchedProduct),
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

      <ProductDetailContent
        product={product}
        galleryImages={galleryImages}
        ratingPercentage={ratingPercentage}
        ratingCount={ratingCount}
      />

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
