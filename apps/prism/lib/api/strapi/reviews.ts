import { apiClient } from '../client';

interface StrapiReviewRaw {
  id: number;
  documentId?: string;
  sku: string;
  author_name: string;
  rating: number;
  title: string;
  content: string;
  verified?: boolean | null;
  helpful_count?: number | null;
  review_status?: 'pending' | 'approved' | 'rejected' | null;
  createdAt?: string;
  updatedAt?: string;
}

interface StrapiReviewListResponseRaw {
  data: StrapiReviewRaw[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiReviewSummaryRaw {
  data?: {
    sku: string;
    average: number;
    total: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  };
}

interface SubmitReviewResponseRaw {
  data: StrapiReviewRaw;
  meta?: {
    message?: string;
  };
}

export interface ProductReview {
  id: number;
  documentId?: string;
  sku: string;
  authorName: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  helpfulCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductReviewSummary {
  sku: string;
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ProductReviewPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface ProductReviewListResult {
  items: ProductReview[];
  pagination: ProductReviewPagination;
}

export interface SubmitProductReviewInput {
  sku: string;
  authorName: string;
  authorEmail: string;
  magentoUserId: string;
  rating: number;
  title: string;
  content: string;
}

export interface SubmitProductReviewResult {
  review: ProductReview;
  message: string;
}

function normalizeReview(review: StrapiReviewRaw): ProductReview {
  return {
    id: review.id,
    documentId: review.documentId,
    sku: review.sku,
    authorName: review.author_name,
    rating: Number(review.rating ?? 0),
    title: review.title,
    content: review.content,
    verified: review.verified ?? false,
    helpfulCount: Number(review.helpful_count ?? 0),
    status: review.review_status ?? 'pending',
    createdAt: review.createdAt ?? null,
    updatedAt: review.updatedAt ?? null,
  };
}

function emptySummary(sku: string): ProductReviewSummary {
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

export async function fetchReviewsBySku(
  sku: string,
  page = 1,
  pageSize = 10
): Promise<ProductReviewListResult> {
  const response = await apiClient.get<StrapiReviewListResponseRaw>(
    `api/product-reviews/by-sku/${encodeURIComponent(
      sku
    )}?page=${page}&pageSize=${pageSize}`,
    {
      next: { tags: ['product-reviews'], revalidate: 300 },
    } as Parameters<typeof apiClient.get>[1]
  );

  return {
    items: response.data.map(normalizeReview),
    pagination: response.meta.pagination,
  };
}

export async function fetchReviewSummaryBySku(
  sku: string
): Promise<ProductReviewSummary> {
  const response = await apiClient.get<StrapiReviewSummaryRaw>(
    `api/product-review-summaries/by-sku/${encodeURIComponent(sku)}`,
    {
      next: { tags: ['product-review-summaries'], revalidate: 300 },
    } as Parameters<typeof apiClient.get>[1]
  );

  if (!response.data) {
    return emptySummary(sku);
  }

  return {
    sku: response.data.sku,
    average: Number(response.data.average ?? 0),
    total: Number(response.data.total ?? 0),
    distribution: {
      1: Number(response.data.distribution?.[1] ?? 0),
      2: Number(response.data.distribution?.[2] ?? 0),
      3: Number(response.data.distribution?.[3] ?? 0),
      4: Number(response.data.distribution?.[4] ?? 0),
      5: Number(response.data.distribution?.[5] ?? 0),
    },
  };
}

export async function submitReview(
  input: SubmitProductReviewInput,
  accessToken?: string | null
): Promise<SubmitProductReviewResult> {
  const response = await apiClient.post<SubmitReviewResponseRaw>(
    'api/product-reviews',
    {
      data: {
        sku: input.sku,
        author_name: input.authorName,
        author_email: input.authorEmail,
        magento_user_id: input.magentoUserId,
        rating: input.rating,
        title: input.title,
        content: input.content,
      },
    },
    {
      cache: 'no-store',
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
      skipLogging: true,
    } as Parameters<typeof apiClient.post>[2]
  );

  return {
    review: normalizeReview(response.data),
    message: response.meta?.message ?? 'Review submitted and pending approval.',
  };
}
