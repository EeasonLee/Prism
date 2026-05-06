import { beforeEach, describe, expect, it, vi } from 'vitest';

const envState = vi.hoisted(() => ({
  NODE_ENV: 'test',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_API_URL: 'http://public-api.example.com',
  STRAPI_URL: 'http://localhost:1337',
  NEXT_PUBLIC_IMAGE_BASE_URL: undefined as string | undefined,
  NEXT_PUBLIC_LOG_LEVEL: 'info',
  NEXT_PUBLIC_USE_API_PROXY: undefined as string | undefined,
  NEXT_PUBLIC_APP_VERSION: undefined as string | undefined,
  NEXT_PUBLIC_MAGENTO_API_URL: undefined as string | undefined,
  MEILISEARCH_HOST: undefined as string | undefined,
  MEILISEARCH_API_KEY: undefined as string | undefined,
  STRAPI_API_TOKEN: undefined as string | undefined,
  STRAPI_INTERNAL_URL: undefined as string | undefined,
}));

vi.mock('@/infrastructure/config/env', () => ({
  env: envState,
}));

describe('review media normalization', async () => {
  const { mergeReviewMediaForTest, normalizeReviewMediaForTest } = await import(
    '@/features/product/reviews.api'
  );

  beforeEach(() => {
    envState.STRAPI_URL = 'http://localhost:1337';
    envState.NEXT_PUBLIC_IMAGE_BASE_URL =
      'https://d2s2mafqv46idp.cloudfront.net/joydeem/media';
  });

  it('converts relative review media URLs to cloudfront review paths', () => {
    expect(
      normalizeReviewMediaForTest({
        id: 1,
        url: '/uploads/review-image.jpg',
        posterUrl: '/uploads/review-poster.jpg',
        width: 360,
        mime: 'image/jpeg',
      })
    ).toMatchObject({
      url: 'https://d2s2mafqv46idp.cloudfront.net/joydeem/media/360/amasty/review/uploads/review-image.jpg',
      posterUrl:
        'https://d2s2mafqv46idp.cloudfront.net/joydeem/media/360/amasty/review/uploads/review-poster.jpg',
    });
  });

  it('merges legacy images field into media list', () => {
    const merged = mergeReviewMediaForTest(
      [],
      '/_/3/_31.png,/_/3/_32.png, /_/3/_31.png'
    );

    expect(merged.map(item => item.url)).toEqual([
      'https://d2s2mafqv46idp.cloudfront.net/joydeem/media/800/amasty/review/_/3/_31.png',
      'https://d2s2mafqv46idp.cloudfront.net/joydeem/media/800/amasty/review/_/3/_32.png',
    ]);
  });
});
