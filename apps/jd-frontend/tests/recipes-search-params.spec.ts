import { describe, expect, it } from 'vitest';
import {
  parseRecipeKeywordSearchParams,
  parseRecipeSearchParams,
} from '@/features/recipe';

describe('parseRecipeSearchParams', () => {
  it('parses page, pageSize, includeFacets and comma-separated filter ids', () => {
    const sp = new URLSearchParams(
      'page=2&pageSize=24&includeFacets=true&recipeTypes=1,2&categoryId=5'
    );
    const result = parseRecipeSearchParams(sp);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(24);
    expect(result.includeFacets).toBe(true);
    expect(result.recipeTypes).toEqual([1, 2]);
    expect(result.categoryId).toBe(5);
  });

  it('defaults omitted includeFacets to undefined', () => {
    const sp = new URLSearchParams('page=1');
    const result = parseRecipeSearchParams(sp);
    expect(result.includeFacets).toBeUndefined();
  });
});

describe('parseRecipeKeywordSearchParams', () => {
  it('parses q and optional filters', () => {
    const sp = new URLSearchParams(
      'q=soup&page=1&pageSize=10&difficulty=easy&sort=title'
    );
    const result = parseRecipeKeywordSearchParams(sp);
    expect(result.q).toBe('soup');
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.difficulty).toBe('easy');
    expect(result.sort).toBe('title');
  });

  it('returns empty q when missing', () => {
    const sp = new URLSearchParams('page=1');
    const result = parseRecipeKeywordSearchParams(sp);
    expect(result.q).toBe('');
  });
});
