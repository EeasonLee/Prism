/**
 * BFF route for unified recipe search (keyword + faceted).
 */
/* eslint-disable import/first -- vi.mock must run before route imports */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/features/recipe', () => ({
  fetchRecipeFacetedSearchStrapi: vi.fn(),
  fetchRecipeKeywordSearchStrapi: vi.fn(),
  parseRecipeSearchParams: (sp: URLSearchParams) => {
    const page = Number(sp.get('page')) || undefined;
    const pageSize = Number(sp.get('pageSize')) || undefined;
    const includeFacets = sp.get('includeFacets') === 'true' ? true : undefined;
    return { page, pageSize, includeFacets };
  },
  parseRecipeKeywordSearchParams: (sp: URLSearchParams) => ({
    q: sp.get('q')?.trim() ?? '',
    page: Number(sp.get('page')) || undefined,
    pageSize: Number(sp.get('pageSize')) || undefined,
  }),
}));

import {
  fetchRecipeFacetedSearchStrapi,
  fetchRecipeKeywordSearchStrapi,
} from '@/features/recipe';
import { GET as getRecipeSearch } from '../app/api/recipes/search/route';

const mockFaceted = vi.mocked(fetchRecipeFacetedSearchStrapi);
const mockKeyword = vi.mocked(fetchRecipeKeywordSearchStrapi);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/recipes/search', () => {
  describe('keyword search (q present)', () => {
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
        'http://localhost/api/recipes/search?q=noodles&page=1'
      );
      const res = await getRecipeSearch(request);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.data).toEqual([]);
      expect(mockKeyword).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'noodles', page: 1 })
      );
    });
  });

  describe('faceted search (no q)', () => {
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
      const res = await getRecipeSearch(request);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.data).toEqual([]);
      expect(mockFaceted).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, includeFacets: true })
      );
    });
  });
});
