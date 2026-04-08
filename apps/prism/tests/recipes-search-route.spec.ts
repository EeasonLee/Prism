/**
 * BFF routes for recipe faceted / keyword search.
 */
/* eslint-disable import/first -- vi.mock must run before route imports */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api/recipes', () => ({
  fetchRecipeFacetedSearchStrapi: vi.fn(),
  fetchRecipeKeywordSearchStrapi: vi.fn(),
}));

import {
  fetchRecipeFacetedSearchStrapi,
  fetchRecipeKeywordSearchStrapi,
} from '@/lib/api/recipes';
import { GET as getFacetedSearch } from '../app/api/recipes/search/route';
import { GET as getKeywordSearch } from '../app/api/search/recipes/route';

const mockFaceted = vi.mocked(fetchRecipeFacetedSearchStrapi);
const mockKeyword = vi.mocked(fetchRecipeKeywordSearchStrapi);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/recipes/search', () => {
  it('delegates to fetchRecipeFacetedSearchStrapi and returns JSON', async () => {
    mockFaceted.mockResolvedValueOnce({
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 12,
          pageCount: 0,
          total: 0,
        },
      },
    });

    const request = new NextRequest(
      'http://localhost/api/recipes/search?page=1&includeFacets=true'
    );
    const res = await getFacetedSearch(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(mockFaceted).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, includeFacets: true })
    );
  });
});

describe('GET /api/search/recipes', () => {
  it('returns 400 when q is missing', async () => {
    const request = new NextRequest(
      'http://localhost/api/search/recipes?page=1'
    );
    const res = await getKeywordSearch(request);
    expect(res.status).toBe(400);
  });

  it('delegates to fetchRecipeKeywordSearchStrapi when q is set', async () => {
    mockKeyword.mockResolvedValueOnce({
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 12,
          pageCount: 0,
          total: 0,
        },
      },
    });

    const request = new NextRequest(
      'http://localhost/api/search/recipes?q=noodles&page=1'
    );
    const res = await getKeywordSearch(request);
    expect(res.status).toBe(200);
    await res.json();
    expect(mockKeyword).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'noodles', page: 1 })
    );
  });
});
