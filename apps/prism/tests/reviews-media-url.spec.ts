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

vi.mock('../lib/env', () => ({
  env: envState,
}));

describe('review media normalization', async () => {
  const { normalizeReviewMediaForTest } = await import(
    '../lib/api/strapi/reviews'
  );

  beforeEach(() => {
    envState.STRAPI_URL = 'http://localhost:1337';
  });

  it('expands relative review media URLs to absolute Strapi URLs', () => {
    expect(
      normalizeReviewMediaForTest({
        id: 1,
        url: '/uploads/review-image.jpg',
        posterUrl: '/uploads/review-poster.jpg',
        mime: 'image/jpeg',
      })
    ).toMatchObject({
      url: 'http://localhost:1337/uploads/review-image.jpg',
      posterUrl: 'http://localhost:1337/uploads/review-poster.jpg',
    });
  });
});
