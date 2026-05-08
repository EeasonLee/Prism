import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductReviews } from '../app/products/[slug]/ProductReviews';
import type {
  ProductReview,
  ProductReviewPagination,
  ProductReviewSummary,
} from '@/features/product';

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

vi.mock('../app/products/[slug]/ReviewForm', () => ({
  ReviewForm: () => <div data-testid="review-form">Review form</div>,
}));

vi.mock('../app/products/[slug]/review-visitor-key', () => ({
  getReviewVisitorKey: () => 'visitor-123',
}));

vi.mock('../app/recipes/components/Pagination', () => ({
  Pagination: () => <div data-testid="pagination">Pagination</div>,
}));

const target = {
  sku: 'PARENT',
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
  authorName: 'Ava Buyer',
  rating: 4.5,
  title: 'Works well',
  content: 'Easy to use and the selected variant matched the listing.',
  media: [
    {
      id: 10,
      kind: 'video',
      url: 'https://example.com/review-video.webm',
      width: null,
      height: null,
      mime: 'video/webm',
      alt: 'Review video',
      posterUrl: null,
    },
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
  reviewTags: [],
  dimensionRatings: [],
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
  it('renders sku, half-star ratings, and helpful actions', () => {
    render(
      <ProductReviews
        sku="PARENT"
        target={target}
        summary={summary}
        initialReviews={[review]}
        initialPagination={pagination}
      />
    );

    expect(screen.getByText('PARENT')).toBeInTheDocument();
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

  it('renders summary distribution with integer star buckets only', () => {
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
    const summaryLines = within(summaryNode).getAllByText(
      (_content, node) => node?.tagName === 'SPAN'
    );
    const labels = summaryLines
      .map(node => node.textContent?.trim() ?? '')
      .filter(Boolean);

    expect(labels).toContain('5★');
    expect(labels).toContain('4★');
    expect(labels).toContain('3★');
    expect(labels).toContain('2★');
    expect(labels).toContain('1★');
    expect(labels).not.toContain('4.5★');
    expect(labels).not.toContain('3.5★');
    expect(labels).not.toContain('2.5★');
    expect(labels).not.toContain('1.5★');
  });

  it('shows a visual video thumbnail, opens review media, and navigates to the next image', async () => {
    const user = userEvent.setup();

    render(
      <ProductReviews
        sku="PARENT"
        target={target}
        summary={summary}
        initialReviews={[review]}
        initialPagination={pagination}
      />
    );

    expect(screen.getByLabelText('Review video')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /preview review media 1/i })
    );

    const dialog = screen.getByRole('dialog', {
      name: /media viewer video preview/i,
    });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Review video')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /^show next media$/i })
    );

    expect(
      screen.getByRole('dialog', { name: /media viewer image preview/i })
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByAltText('Review image')
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /close media viewer/i })
    );

    expect(
      screen.queryByRole('dialog', { name: /media viewer/i })
    ).not.toBeInTheDocument();
  });
});
