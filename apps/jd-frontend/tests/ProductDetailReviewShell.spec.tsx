import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductDetailReviewShell } from '../app/products/[slug]/ProductDetailReviewShell';
import type {
  ProductReviewPagination,
  ProductReviewSummary,
  UnifiedProduct,
} from '@/features/product';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../app/products/[slug]/ProductImageGallery', () => ({
  ProductImageGallery: () => <div data-testid="product-image-gallery" />,
}));

vi.mock('../app/products/[slug]/ProductDetailClient', () => ({
  ProductDetailClient: () => <div data-testid="product-detail-client" />,
}));

vi.mock('../app/_ui/share', () => ({
  ShareTrigger: () => <button type="button">Share</button>,
}));

vi.mock('../app/products/[slug]/ReviewForm', () => ({
  ReviewForm: () => <div data-testid="review-form">Review form</div>,
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ isAuthenticated: false }),
  useAuthModal: () => ({ openLogin: vi.fn() }),
}));

vi.mock('@/features/product', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/product')>();
  return {
    ...actual,
    CouponBanner: () => <div data-testid="coupon-banner" />,
    useCouponClaim: () => ({
      isClaimed: false,
      claimedCode: null,
      claim: vi.fn(),
    }),
  };
});

vi.mock('@/shared/utils/gtm', () => ({
  gtmViewItem: vi.fn(),
  mapDisplayToGtmItem: vi.fn(() => ({})),
}));

const product: UnifiedProduct = {
  id: 1,
  sku: 'JD-AF550',
  name: 'Air Fryer',
  url_key: 'air-fryer',
  price: 199.99,
  final_price: 199.99,
  currency: 'USD',
  stock_status: 'IN_STOCK',
  status: 1,
  visibility: 4,
  type_id: 'simple',
  image_url: null,
  thumbnail_url: null,
  short_description: null,
  description: null,
  media_gallery: [],
  categories: [],
  configurable_options: [],
  _enriched: true,
  display_name: 'Air Fryer',
  subtitle: null,
  short_description_html: null,
  description_html: null,
  product_detail_html: null,
  unified_images: [],
  unified_thumbnail: null,
  promotion_label: null,
  promotion_expires_at: null,
  is_featured: false,
  seo_title: null,
  seo_description: null,
  stock_qty: 8,
  is_in_stock: true,
  review_count: 0,
};

const emptySummary: ProductReviewSummary = {
  sku: 'JD-AF550',
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

const emptyPagination: ProductReviewPagination = {
  page: 1,
  pageSize: 10,
  pageCount: 0,
  total: 0,
};

describe('ProductDetailReviewShell', () => {
  it('hides the Customer Reviews section when empty but keeps Write a review modal available', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProductDetailReviewShell
        product={product}
        galleryImages={[]}
        ratingPercentage={0}
        ratingCount={0}
        reviewSku="JD-AF550"
        summary={emptySummary}
        initialReviews={[]}
        initialPagination={emptyPagination}
        allowSubmit
      />
    );

    expect(
      screen.queryByRole('heading', { name: /customer reviews/i })
    ).not.toBeInTheDocument();
    expect(container.querySelector('#section-reviews')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /write a review/i }));

    expect(
      screen.getByRole('dialog', { name: /write a review/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('review-form')).toBeInTheDocument();
  });
});
