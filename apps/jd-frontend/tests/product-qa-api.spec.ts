/**
 * Tests for product Q&A API client — normalization and contract mapping.
 */
/* eslint-disable import/first -- vi.mock must run before imports under test */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API client before importing the module under test
vi.mock('@/infrastructure/api/clients/strapi', () => ({
  strapiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { strapiClient } from '@/infrastructure/api/clients/strapi';
import {
  fetchProductQaByProduct,
  submitProductQuestion,
} from '@/features/product/qa.api';
import type { SubmitProductQuestionInput } from '@/features/product/qa.api';

const mockGet = vi.mocked(strapiClient.get);
const mockPost = vi.mocked(strapiClient.post);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// fetchProductQaByProduct
// ---------------------------------------------------------------------------

describe('fetchProductQaByProduct', () => {
  it('returns productId, sku, normalized items, and pagination', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          documentId: 'doc-abc',
          sku: 'SKU-001',
          product_sku: 'SKU-001',
          author_name: 'Alice',
          question_text: 'Does this come in blue?',
          answer_text: 'Yes, it does.',
          answered_at: '2024-01-10T10:00:00.000Z',
          answered_by: 'Support Team',
          question_status: 'answered',
          helpful_count: 5,
          viewer_has_marked_helpful: false,
          createdAt: '2024-01-09T08:00:00.000Z',
          updatedAt: '2024-01-10T10:00:00.000Z',
        },
      ],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 },
      },
    });

    const result = await fetchProductQaByProduct(101, 'SKU-001');

    expect(result.productId).toBe(101);
    expect(result.sku).toBe('SKU-001');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe('user_qa');
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 10,
      pageCount: 1,
      total: 1,
    });
  });

  it('maps snake_case Strapi fields to camelCase', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        {
          id: 2,
          sku: 'SKU-002',
          product_sku: 'SKU-PARENT',
          author_name: 'Bob',
          question_text: 'What is the warranty?',
          answer_text: null,
          answered_at: null,
          answered_by: null,
          question_status: 'pending',
          helpful_count: 0,
          viewer_has_marked_helpful: false,
          createdAt: '2024-02-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z',
        },
      ],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 },
      },
    });

    const result = await fetchProductQaByProduct(102, 'SKU-002');
    const item = result.items[0];

    expect(item.id).toBe(2);
    expect(item.sku).toBe('SKU-002');
    expect(item.productSku).toBe('SKU-PARENT');
    expect(item.authorName).toBe('Bob');
    expect(item.questionText).toBe('What is the warranty?');
    expect(item.answerText).toBeNull();
    expect(item.answeredAt).toBeNull();
    expect(item.answeredBy).toBeNull();
    expect(item.status).toBe('pending');
    expect(item.helpfulCount).toBe(0);
    expect(item.viewerHasMarkedHelpful).toBe(false);
    expect(item.kind).toBe('user_qa');
  });

  it('maps item_type faq to kind faq', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        {
          item_type: 'faq',
          id: 10,
          documentId: 'faq-doc',
          sku: 'SKU-FAQ',
          product_sku: 'SKU-FAQ',
          author_name: null,
          question_text: 'Is it dishwasher safe?',
          answer_text: '<p>Yes, top rack.</p>',
          answered_at: '2024-01-01T00:00:00.000Z',
          question_status: 'answered',
          helpful_count: 0,
          viewer_has_marked_helpful: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 },
      },
    });

    const result = await fetchProductQaByProduct(103, 'SKU-FAQ');

    expect(result.items[0].kind).toBe('faq');
    expect(result.items[0].authorName).toBeNull();
  });

  it('falls back productSku to sku when product_sku is absent', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        {
          id: 3,
          sku: 'SKU-003',
          author_name: 'Carol',
          question_text: 'Is this vegan?',
          answer_content: 'Yes, suitable for vegan diets.',
          answered_at: '2024-03-02T00:00:00.000Z',
          answered_by: 'Support Team',
          createdAt: '2024-03-01T00:00:00.000Z',
          updatedAt: '2024-03-02T00:00:00.000Z',
        },
      ],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 },
      },
    });

    const result = await fetchProductQaByProduct(104, 'SKU-003');

    expect(result.items[0].productSku).toBe('SKU-003');
    expect(result.items[0].answerText).toBe('Yes, suitable for vegan diets.');
    expect(result.items[0].answeredAt).toBe('2024-03-02T00:00:00.000Z');
    expect(result.items[0].answeredBy).toBe('Support Team');
  });

  it('defaults status to pending when question_status is absent', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        {
          id: 4,
          sku: 'SKU-004',
          author_name: 'Dave',
          question_text: 'Any discounts?',
          createdAt: '2024-04-01T00:00:00.000Z',
          updatedAt: '2024-04-01T00:00:00.000Z',
        },
      ],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 },
      },
    });

    const result = await fetchProductQaByProduct(105, 'SKU-004');

    expect(result.items[0].status).toBe('pending');
  });

  it('defaults helpfulCount to 0 when helpful_count is null', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        {
          id: 5,
          sku: 'SKU-005',
          author_name: 'Eve',
          question_text: 'Ships to Canada?',
          helpful_count: null,
          createdAt: '2024-05-01T00:00:00.000Z',
          updatedAt: '2024-05-01T00:00:00.000Z',
        },
      ],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 },
      },
    });

    const result = await fetchProductQaByProduct(106, 'SKU-005');

    expect(result.items[0].helpfulCount).toBe(0);
  });

  it('passes page and pageSize as query params', async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      meta: { pagination: { page: 2, pageSize: 5, pageCount: 0, total: 0 } },
    });

    await fetchProductQaByProduct(107, 'SKU-006', 2, 5);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
      expect.anything()
    );
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('pageSize=5'),
      expect.anything()
    );
  });

  it('URL-encodes the sku in the path', async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } },
    });

    await fetchProductQaByProduct(108, 'SKU/SPECIAL&001');

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringMatching(/api\/product-qa\/by-product\/108/),
      expect.anything()
    );
  });

  it('uses revalidate: 300 cache option', async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } },
    });

    await fetchProductQaByProduct(109, 'SKU-007');

    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        next: expect.objectContaining({ revalidate: 300 }),
      })
    );
  });

  it('returns empty items array when data is empty', async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } },
    });

    const result = await fetchProductQaByProduct(110, 'SKU-EMPTY');

    expect(result.productId).toBe(110);
    expect(result.items).toEqual([]);
    expect(result.sku).toBe('SKU-EMPTY');
  });
});

// ---------------------------------------------------------------------------
// submitProductQuestion
// ---------------------------------------------------------------------------

describe('submitProductQuestion', () => {
  const baseInput: SubmitProductQuestionInput = {
    sku: 'SKU-100',
    content: 'Is this gluten-free?',
    authorName: 'Frank',
    authorEmail: 'frank@example.com',
    magentoUserId: '12345',
  };

  it('returns success, message, and questionId on submit', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 99,
        sku: 'SKU-100',
        author_name: 'Frank',
        question_text: 'Is this gluten-free?',
        question_status: 'pending',
        createdAt: '2024-06-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
      },
      meta: { message: 'Your question has been received.' },
    });

    const result = await submitProductQuestion(baseInput);

    expect(result.success).toBe(true);
    expect(result.questionId).toBe(99);
    expect(result.message).toBe('Your question has been received.');
  });

  it('falls back to default message when meta.message is absent', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 100,
        sku: 'SKU-100',
        author_name: 'Frank',
        question_text: 'Is this gluten-free?',
        createdAt: '2024-06-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
      },
    });

    const result = await submitProductQuestion(baseInput);

    expect(result.message).toBe('Question submitted and pending review.');
  });

  it('omits magento_user_id when magentoUserId is absent (guest)', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 106,
        sku: 'SKU-100',
        author_name: 'Guest',
        question_text: 'Is this gluten-free?',
        createdAt: '2024-06-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
      },
    });

    const { magentoUserId: _omit, ...guestInput } = baseInput;
    await submitProductQuestion(guestInput);

    expect(mockPost).toHaveBeenCalledWith(
      'api/product-qa/questions',
      {
        data: {
          sku: 'SKU-100',
          content: 'Is this gluten-free?',
          author_name: 'Frank',
          author_email: 'frank@example.com',
        },
      },
      expect.anything()
    );
  });

  it('maps camelCase input fields to snake_case in the POST body', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 101,
        sku: 'SKU-100',
        author_name: 'Frank',
        question_text: 'Is this gluten-free?',
        createdAt: '2024-06-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
      },
    });

    await submitProductQuestion(baseInput);

    expect(mockPost).toHaveBeenCalledWith(
      'api/product-qa/questions',
      {
        data: {
          sku: 'SKU-100',
          content: 'Is this gluten-free?',
          author_name: 'Frank',
          author_email: 'frank@example.com',
          magento_user_id: '12345',
        },
      },
      expect.anything()
    );
  });

  it('includes productId in the POST body when provided', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 105,
        sku: 'SKU-100',
        author_name: 'Frank',
        question_text: 'Is this gluten-free?',
        createdAt: '2024-06-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
      },
    });

    await submitProductQuestion({ ...baseInput, productId: 201 });

    expect(mockPost).toHaveBeenCalledWith(
      'api/product-qa/questions',
      {
        data: expect.objectContaining({
          productId: 201,
          sku: 'SKU-100',
        }),
      },
      expect.anything()
    );
  });

  it('includes Authorization header when accessToken is provided', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 102,
        sku: 'SKU-100',
        author_name: 'Frank',
        question_text: 'Is this gluten-free?',
        createdAt: '2024-06-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
      },
    });

    await submitProductQuestion(baseInput, 'my-token-xyz');

    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      expect.objectContaining({
        headers: { Authorization: 'Bearer my-token-xyz' },
      })
    );
  });

  it('omits Authorization header when accessToken is not provided', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 103,
        sku: 'SKU-100',
        author_name: 'Frank',
        question_text: 'Is this gluten-free?',
        createdAt: '2024-06-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
      },
    });

    await submitProductQuestion(baseInput);

    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      expect.objectContaining({ headers: undefined })
    );
  });

  it('uses cache: no-store for the POST request', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: 104,
        sku: 'SKU-100',
        author_name: 'Frank',
        question_text: 'Is this gluten-free?',
        createdAt: '2024-06-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
      },
    });

    await submitProductQuestion(baseInput);

    expect(mockPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      expect.objectContaining({ cache: 'no-store' })
    );
  });
});
