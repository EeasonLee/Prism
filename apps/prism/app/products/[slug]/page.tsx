import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageContainer } from '@prism/ui';
import { fetchUnifiedProductBySlug } from '../../../lib/api/unified-product';
import {
  fetchReviewsBySku,
  fetchReviewSummaryBySku,
  type ProductReviewListResult,
  type ProductReviewSummary,
} from '../../../lib/api/strapi/reviews';
import {
  fetchProductQaBySku,
  type ProductQaListResult,
} from '../../../lib/api/strapi/product-qa';
import { ProductDetailReviewShell } from './ProductDetailReviewShell';
import { ProductSectionNav } from './ProductSectionNav';
import { SellingPoints } from './SellingPoints';
import { ProductGuarantees } from './ProductGuarantees';
import { ProductVideosSection } from './ProductVideosSection';
import { RecipesSection } from './RecipesSection';
import { BlogSection } from './BlogSection';
import { ProductSpecifications } from './ProductSpecifications';
import type { ProductSpecificationGroup } from '../../../lib/api/strapi/product-enrichment';
import { MOCK_PRODUCT_SKU, mockProduct, mockProductExtras } from './mock-data';
import {
  buildPdpSectionNav,
  fetchRealProductPageCms,
  type ProductDetailPageData,
} from './product-detail-data';

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

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const decodedSku = decodeURIComponent(slug);

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
  const { slug } = await params;
  const decodedSku = decodeURIComponent(slug);

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

  if (decodedSku === MOCK_PRODUCT_SKU) {
    data = { product: mockProduct, cms: mockProductExtras };
  } else {
    const fetchedProduct = await fetchUnifiedProductBySlug(decodedSku).catch(
      () => null
    );

    if (!fetchedProduct) notFound();

    const [fetchedSummary, fetchedReviews, fetchedProductQa, fetchedCms] =
      await Promise.all([
        fetchReviewSummaryBySku(fetchedProduct.sku).catch(() =>
          emptyReviewSummary(fetchedProduct.sku)
        ),
        fetchReviewsBySku(fetchedProduct.sku, 1, 10).catch(() => ({
          items: [],
          pagination: {
            page: 1,
            pageSize: 10,
            pageCount: 0,
            total: 0,
          },
        })),
        fetchProductQaBySku(fetchedProduct.id, fetchedProduct.sku, 1, 10).catch(
          () => ({
            productId: fetchedProduct.id,
            sku: fetchedProduct.sku,
            items: [],
            pagination: {
              page: 1,
              pageSize: 10,
              pageCount: 0,
              total: 0,
            },
          })
        ),
        fetchRealProductPageCms(fetchedProduct.sku).catch(() => null),
      ]);

    data = {
      product: fetchedProduct,
      cms: fetchedCms,
    };
    reviewSummary = fetchedSummary;
    reviewList = fetchedReviews;
    initialProductQa = fetchedProductQa;
  }

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
              href={`/categories/${product.categories[0].id}`}
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
        summary={
          decodedSku === MOCK_PRODUCT_SKU
            ? undefined
            : reviewSummary ?? emptyReviewSummary(reviewSku)
        }
        initialReviews={
          decodedSku === MOCK_PRODUCT_SKU ? undefined : reviewList.items
        }
        initialPagination={
          decodedSku === MOCK_PRODUCT_SKU ? undefined : reviewList.pagination
        }
        mockSummary={
          decodedSku === MOCK_PRODUCT_SKU
            ? mockProductExtras.review_summary
            : undefined
        }
        mockReviews={
          decodedSku === MOCK_PRODUCT_SKU
            ? mockProductExtras.reviews
            : undefined
        }
        allowSubmit={decodedSku !== MOCK_PRODUCT_SKU}
        initialProductQa={initialProductQa}
      />

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

      {specificationGroups.length > 0 && (
        <div id="section-specifications">
          <div className="border-t border-border" />
          <ProductSpecifications groups={specificationGroups} />
        </div>
      )}

      {(cms?.product_videos?.length ?? 0) > 0 && (
        <div id="section-videos">
          <div className="border-t border-border" />
          <ProductVideosSection videos={cms?.product_videos ?? []} />
        </div>
      )}

      {(cms?.recipes?.length ?? 0) > 0 && (
        <div id="section-recipes">
          <div className="border-t border-border" />
          <RecipesSection recipes={cms?.recipes ?? []} />
        </div>
      )}

      {(cms?.blog_posts?.length ?? 0) > 0 && (
        <div id="section-blog">
          <div className="border-t border-border" />
          <BlogSection posts={cms?.blog_posts ?? []} />
        </div>
      )}
    </PageContainer>
  );
}
