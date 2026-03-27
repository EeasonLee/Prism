import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductReviews } from '../app/products/[sku]/ProductReviews';
import type {
  ProductReview,
  ProductReviewPagination,
  ProductReviewSummary,
} from '../lib/api/strapi/reviews';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src?: string;
    alt?: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test mock replaces next/image
    <img src={src ?? ''} alt={alt ?? ''} className={className} />
  ),
}));

vi.mock('../app/products/[sku]/ReviewForm', () => ({
  ReviewForm: () => <div data-testid="review-form">Review form</div>,
}));

vi.mock('../app/products/[sku]/review-visitor-key', () => ({
  getReviewVisitorKey: () => 'visitor-123',
}));

vi.mock('../app/recipes/components/Pagination', () => ({
  Pagination: () => <div data-testid="pagination">Pagination</div>,
}));

const target = {
  productSku: 'PARENT',
  purchasedSku: 'CHILD',
  purchasedVariantLabel: 'Black / 2 Pack',
  requiresVariantSelection: false,
};

const summary: ProductReviewSummary = {
  sku: 'PARENT',
  average: 4.5,
  total: 8,
  distribution: {
    '1': 0,
    '1.5': 0,
    '2': 0,
    '2.5': 0,
    '3': 1,
    '3.5': 0,
    '4': 2,
    '4.5': 3,
    '5': 2,
  },
};

const review: ProductReview = {
  id: 1,
  documentId: 'review-doc-1',
  sku: 'PARENT',
  productSku: 'PARENT',
  purchasedSku: 'CHILD',
  purchasedVariantLabel: 'Black / 2 Pack',
  authorName: 'Ava Buyer',
  rating: 4.5,
  title: 'Works well',
  content: 'Easy to use and the selected variant matched the listing.',
  media: [
    {
      id: 11,
      kind: 'image',
      url: 'https://example.com/review-image.jpg',
      width: 120,
      height: 120,
      mime: 'image/jpeg',
      alt: 'Review image',
      posterUrl: null,
    },
  ],
  verified: true,
  helpfulCount: 3,
  viewerHasMarkedHelpful: false,
  status: 'approved',
  createdAt: '2026-03-26T10:00:00.000Z',
  updatedAt: '2026-03-26T10:00:00.000Z',
};

const pagination: ProductReviewPagination = {
  page: 1,
  pageSize: 10,
  pageCount: 1,
  total: 1,
};

describe('ProductReviews', () => {
  it('renders purchased variant labels, half-star ratings, and helpful actions', () => {
    render(
      <ProductReviews
        sku="PARENT"
        target={target}
        summary={summary}
        initialReviews={[review]}
        initialPagination={pagination}
      />
    );

    expect(screen.getByText('Black / 2 Pack')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /helpful \(3\)/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/4.5 out of 5/i)).toBeInTheDocument();
  });

  it('renders mobile-first summary above the review list', () => {
    render(
      <ProductReviews
        sku="PARENT"
        target={target}
        summary={summary}
        initialReviews={[review]}
        initialPagination={pagination}
      />
    );

    const summaryNode = screen.getByTestId('reviews-summary');
    const reviewTitle = screen.getByText('Works well');

    expect(summaryNode).toBeInTheDocument();
    expect(reviewTitle).toBeInTheDocument();
    expect(
      summaryNode.compareDocumentPosition(reviewTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
