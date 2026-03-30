import { apiClient } from '../client';

/** Strapi 聚合/列表接口返回的单条（snake_case，含 item_type） */
interface StrapiQuestionRaw {
  item_type?: 'faq' | 'user_qa';
  id: number;
  documentId?: string;
  sku: string;
  product_sku?: string;
  author_name: string | null;
  author_email?: string;
  question_text?: string;
  content?: string;
  answer_text?: string | null;
  answered_at?: string | null;
  answered_by?: string | null;
  question_status?: 'pending' | 'answered' | 'published' | 'rejected' | null;
  helpful_count?: number | null;
  viewer_has_marked_helpful?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  /** nested shape from legacy findBySku only */
  answer?: {
    content?: string;
    is_published?: boolean;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  status?: 'pending' | 'answered' | 'published';
}

interface StrapiQuestionListResponseRaw {
  data: StrapiQuestionRaw[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface SubmitQuestionResponseRaw {
  data: StrapiQuestionRaw;
  meta?: {
    message?: string;
  };
}

export type ProductQaKind = 'faq' | 'user_qa';

export interface ProductQuestion {
  id: number;
  documentId?: string;
  kind: ProductQaKind;
  sku: string;
  productSku: string;
  authorName: string | null;
  questionText: string;
  answerText: string | null;
  answeredAt: string | null;
  answeredBy: string | null;
  status: 'pending' | 'answered' | 'published' | 'rejected';
  helpfulCount: number;
  viewerHasMarkedHelpful: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductQaPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface ProductQaListResult {
  sku: string;
  items: ProductQuestion[];
  pagination: ProductQaPagination;
}

export interface SubmitProductQuestionInput {
  sku: string;
  content: string;
  authorName: string;
  authorEmail: string;
  magentoUserId: string;
}

export interface SubmitProductQuestionResult {
  success: boolean;
  message: string;
  questionId: number;
}

function mapStrapiStatus(raw: StrapiQuestionRaw): ProductQuestion['status'] {
  const s = raw.question_status ?? raw.status;
  if (
    s === 'published' ||
    s === 'answered' ||
    s === 'pending' ||
    s === 'rejected'
  ) {
    return s;
  }
  return 'pending';
}

function resolveAnswerText(raw: StrapiQuestionRaw): string | null {
  if (raw.answer_text !== undefined && raw.answer_text !== null) {
    return raw.answer_text;
  }
  const nested = raw.answer?.content;
  if (nested !== undefined && nested !== null && nested !== '') {
    return nested;
  }
  return null;
}

function normalizeQuestion(raw: StrapiQuestionRaw): ProductQuestion {
  const kind: ProductQaKind = raw.item_type === 'faq' ? 'faq' : 'user_qa';
  const questionText =
    (typeof raw.question_text === 'string' && raw.question_text.length > 0
      ? raw.question_text
      : null) ??
    (typeof raw.content === 'string' ? raw.content : '') ??
    '';

  return {
    id: raw.id,
    documentId: raw.documentId,
    kind,
    sku: raw.sku,
    productSku: raw.product_sku ?? raw.sku,
    authorName:
      raw.author_name !== undefined && raw.author_name !== null
        ? raw.author_name
        : null,
    questionText,
    answerText: resolveAnswerText(raw),
    answeredAt: raw.answered_at ?? null,
    answeredBy: raw.answered_by ?? null,
    status: mapStrapiStatus(raw),
    helpfulCount: Number(raw.helpful_count ?? 0),
    viewerHasMarkedHelpful: raw.viewer_has_marked_helpful ?? false,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export async function fetchProductQaBySku(
  sku: string,
  page = 1,
  pageSize = 10
): Promise<ProductQaListResult> {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const response = await apiClient.get<StrapiQuestionListResponseRaw>(
    `api/product-qa/by-sku/${encodeURIComponent(
      sku
    )}?${searchParams.toString()}`,
    {
      next: { tags: ['product-qa'], revalidate: 300 },
    } as Parameters<typeof apiClient.get>[1]
  );

  return {
    sku,
    items: response.data.map(normalizeQuestion),
    pagination: response.meta.pagination,
  };
}

export async function submitProductQuestion(
  input: SubmitProductQuestionInput,
  accessToken?: string | null
): Promise<SubmitProductQuestionResult> {
  const response = await apiClient.post<SubmitQuestionResponseRaw>(
    'api/product-qa/questions',
    {
      data: {
        sku: input.sku,
        content: input.content,
        author_name: input.authorName,
        author_email: input.authorEmail,
        magento_user_id: input.magentoUserId,
      },
    },
    {
      cache: 'no-store',
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
      skipLogging: true,
    } as Parameters<typeof apiClient.post>[2]
  );

  return {
    success: true,
    message: response.meta?.message ?? 'Question submitted and pending review.',
    questionId: response.data.id,
  };
}
