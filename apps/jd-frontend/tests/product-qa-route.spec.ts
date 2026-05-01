/**
 * Tests for product Q&A BFF routes — GET and POST validation.
 */
/* eslint-disable import/first -- vi.mock must run before imports under test */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ApiError } from '@/core/api/errors';

// Mock the product-qa API client before importing routes
vi.mock('../lib/api/strapi/product-qa', () => ({
  fetchProductQaBySku: vi.fn(),
  submitProductQuestion: vi.fn(),
}));

import {
  fetchProductQaBySku,
  submitProductQuestion,
} from '../lib/api/strapi/product-qa';
import { GET as getQaBySku } from '../app/api/product-qa/by-sku/[sku]/route';
import { POST as postQuestion } from '../app/api/product-qa/questions/route';

const mockFetch = vi.mocked(fetchProductQaBySku);
const mockSubmit = vi.mocked(submitProductQuestion);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/product-qa/by-sku/[sku]
// ---------------------------------------------------------------------------

describe('GET /api/product-qa/by-sku/[sku]', () => {
  it('returns questions for a given SKU', async () => {
    mockFetch.mockResolvedValueOnce({
      productId: 301,
      sku: 'SKU-001',
      items: [
        {
          id: 1,
          sku: 'SKU-001',
          productSku: 'SKU-001',
          authorName: 'Alice',
          questionText: 'Is this vegan?',
          answerText: null,
          answeredAt: null,
          answeredBy: null,
          status: 'pending',
          helpfulCount: 0,
          viewerHasMarkedHelpful: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/by-sku/SKU-001?productId=301'
    );
    const context = { params: Promise.resolve({ sku: 'SKU-001' }) };

    const response = await getQaBySku(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sku).toBe('SKU-001');
    expect(data.items).toHaveLength(1);
  });

  it('decodes URL-encoded SKU', async () => {
    mockFetch.mockResolvedValueOnce({
      productId: 302,
      sku: 'SKU/001',
      items: [],
      pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/by-sku/SKU%2F001?productId=302'
    );
    const context = { params: Promise.resolve({ sku: 'SKU%2F001' }) };

    await getQaBySku(request, context);

    expect(mockFetch).toHaveBeenCalledWith(302, 'SKU/001', 1, 10);
  });

  it('parses and clamps page parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      productId: 303,
      sku: 'SKU-002',
      items: [],
      pagination: { page: 2, pageSize: 10, pageCount: 0, total: 0 },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/by-sku/SKU-002?page=2&productId=303'
    );
    const context = { params: Promise.resolve({ sku: 'SKU-002' }) };

    await getQaBySku(request, context);

    expect(mockFetch).toHaveBeenCalledWith(303, 'SKU-002', 2, 10);
  });

  it('clamps page to minimum 1', async () => {
    mockFetch.mockResolvedValueOnce({
      productId: 304,
      sku: 'SKU-003',
      items: [],
      pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/by-sku/SKU-003?page=0&productId=304'
    );
    const context = { params: Promise.resolve({ sku: 'SKU-003' }) };

    await getQaBySku(request, context);

    expect(mockFetch).toHaveBeenCalledWith(304, 'SKU-003', 1, 10);
  });

  it('parses and clamps pageSize parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      productId: 305,
      sku: 'SKU-004',
      items: [],
      pagination: { page: 1, pageSize: 20, pageCount: 0, total: 0 },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/by-sku/SKU-004?pageSize=20&productId=305'
    );
    const context = { params: Promise.resolve({ sku: 'SKU-004' }) };

    await getQaBySku(request, context);

    expect(mockFetch).toHaveBeenCalledWith(305, 'SKU-004', 1, 20);
  });

  it('clamps pageSize to maximum 50', async () => {
    mockFetch.mockResolvedValueOnce({
      productId: 306,
      sku: 'SKU-005',
      items: [],
      pagination: { page: 1, pageSize: 50, pageCount: 0, total: 0 },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/by-sku/SKU-005?pageSize=100&productId=306'
    );
    const context = { params: Promise.resolve({ sku: 'SKU-005' }) };

    await getQaBySku(request, context);

    expect(mockFetch).toHaveBeenCalledWith(306, 'SKU-005', 1, 50);
  });

  it('returns 502 on upstream failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Upstream timeout'));

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/by-sku/SKU-006?productId=307'
    );
    const context = { params: Promise.resolve({ sku: 'SKU-006' }) };

    const response = await getQaBySku(request, context);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('Upstream timeout');
  });
});

// ---------------------------------------------------------------------------
// POST /api/product-qa/questions
// ---------------------------------------------------------------------------

describe('POST /api/product-qa/questions', () => {
  it('submits a valid question', async () => {
    mockSubmit.mockResolvedValueOnce({
      success: true,
      message: 'Question submitted.',
      questionId: 99,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer my-token' },
        body: JSON.stringify({
          productId: 401,
          sku: 'SKU-100',
          content: 'Is this gluten-free?',
          authorName: 'Alice',
          authorEmail: 'alice@example.com',
          magentoUserId: '42',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.questionId).toBe(99);
  });

  it('trims whitespace from sku and content', async () => {
    mockSubmit.mockResolvedValueOnce({
      success: true,
      message: 'Question submitted.',
      questionId: 100,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer my-token' },
        body: JSON.stringify({
          productId: 402,
          sku: '  SKU-101  ',
          content: '  Does this ship to Canada?  ',
          authorName: 'Bob',
          authorEmail: 'bob@example.com',
          magentoUserId: '43',
        }),
      }
    );

    await postQuestion(request);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 402,
        sku: 'SKU-101',
        content: 'Does this ship to Canada?',
      }),
      'my-token'
    );
  });

  it('returns 400 when productId is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer my-token' },
        body: JSON.stringify({
          content: 'Is this organic?',
          authorName: 'Carol',
          authorEmail: 'carol@example.com',
          magentoUserId: '44',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('sku is required');
  });

  it('returns 400 when content is too short', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer my-token' },
        body: JSON.stringify({
          productId: 403,
          sku: 'SKU-102',
          content: 'Short',
          authorName: 'Dave',
          authorEmail: 'dave@example.com',
          magentoUserId: '45',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('content must be between 10 and 500 characters');
  });

  it('returns 400 when content is too long', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer my-token' },
        body: JSON.stringify({
          productId: 404,
          sku: 'SKU-103',
          content: 'a'.repeat(501),
          authorName: 'Eve',
          authorEmail: 'eve@example.com',
          magentoUserId: '46',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('content must be between 10 and 500 characters');
  });

  it('derives authorName from email when authorName is omitted', async () => {
    mockSubmit.mockResolvedValueOnce({
      success: true,
      message: 'Question submitted.',
      questionId: 199,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer my-token' },
        body: JSON.stringify({
          productId: 405,
          sku: 'SKU-104',
          content: 'Is this available in blue?',
          authorEmail: 'frank.smith@example.com',
          magentoUserId: '47',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        authorName: 'frank.smith',
        authorEmail: 'frank.smith@example.com',
      }),
      'my-token'
    );
  });

  it('returns 400 when authorEmail is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer my-token' },
        body: JSON.stringify({
          productId: 406,
          sku: 'SKU-105',
          content: 'Is this available in blue?',
          authorName: 'Frank',
          magentoUserId: '47',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('authorEmail is required');
  });

  it('accepts guest submission without magentoUserId', async () => {
    mockSubmit.mockResolvedValueOnce({
      success: true,
      message: 'Question submitted.',
      questionId: 107,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        body: JSON.stringify({
          productId: 407,
          sku: 'SKU-106',
          content: 'Is this available in blue?',
          authorName: 'Frank',
          authorEmail: 'frank@example.com',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: 'SKU-106',
        authorEmail: 'frank@example.com',
      }),
      null
    );
  });

  it('returns 400 when authorEmail is invalid', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        body: JSON.stringify({
          sku: 'SKU-106b',
          content: 'Is this available in blue?',
          authorName: 'Frank',
          authorEmail: 'not-an-email',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('authorEmail is invalid');
  });

  it('accepts requests without Authorization header', async () => {
    mockSubmit.mockResolvedValueOnce({
      success: true,
      message: 'Question submitted.',
      questionId: 103,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        body: JSON.stringify({
          sku: 'SKU-107',
          content: 'What is the warranty period?',
          authorName: 'Grace',
          authorEmail: 'grace@example.com',
          magentoUserId: '48',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('passes Authorization header to submitProductQuestion', async () => {
    mockSubmit.mockResolvedValueOnce({
      success: true,
      message: 'Question submitted.',
      questionId: 104,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer my-token-xyz' },
        body: JSON.stringify({
          productId: 409,
          sku: 'SKU-104',
          content: 'What is the warranty period?',
          authorName: 'Hank',
          authorEmail: 'hank@example.com',
          magentoUserId: '49',
        }),
      }
    );

    await postQuestion(request);

    expect(mockSubmit).toHaveBeenCalledWith(expect.anything(), 'my-token-xyz');
  });

  it('preserves ApiError status and message', async () => {
    mockSubmit.mockRejectedValueOnce(
      new ApiError('Rate limit exceeded', 429, undefined, {
        error: 'Too many requests',
      })
    );

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer my-token' },
        body: JSON.stringify({
          productId: 410,
          sku: 'SKU-105',
          content: 'Is this available in blue?',
          authorName: 'Ivy',
          authorEmail: 'ivy@example.com',
          magentoUserId: '50',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Too many requests');
  });

  it('returns 502 on generic upstream failure', async () => {
    mockSubmit.mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest(
      'http://localhost:3000/api/product-qa/questions',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer my-token' },
        body: JSON.stringify({
          productId: 411,
          sku: 'SKU-106',
          content: 'Does this come with a warranty?',
          authorName: 'Jack',
          authorEmail: 'jack@example.com',
          magentoUserId: '51',
        }),
      }
    );

    const response = await postQuestion(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('Network error');
  });
});
