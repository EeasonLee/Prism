import { beforeEach, describe, expect, it, vi } from 'vitest';

const envState = vi.hoisted(() => ({
  NODE_ENV: 'test',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_API_URL: 'http://public-api.example.com',
  STRAPI_URL: undefined as string | undefined,
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

describe('api config', async () => {
  const { getApiBaseUrl, getStrapiBaseUrl, getStrapiServerBaseUrl } =
    await import('../lib/api/config');
  beforeEach(() => {
    envState.NEXT_PUBLIC_API_URL = 'http://public-api.example.com';
    envState.STRAPI_URL = undefined;
    envState.NEXT_PUBLIC_USE_API_PROXY = undefined;
    envState.STRAPI_INTERNAL_URL = undefined;
  });

  it('keeps generic API requests on NEXT_PUBLIC_API_URL', () => {
    expect(getApiBaseUrl()).toBe('http://public-api.example.com');
  });

  it('prefers dedicated Strapi URL for review uploads and media URLs', () => {
    envState.STRAPI_URL = 'http://localhost:1337/';

    expect(getStrapiBaseUrl()).toBe('http://localhost:1337');
  });

  it('prefers internal Strapi URL for server-side proxy routes', () => {
    envState.STRAPI_URL = 'http://localhost:1337';
    envState.STRAPI_INTERNAL_URL = 'http://strapi:1337/';

    expect(getStrapiServerBaseUrl()).toBe('http://strapi:1337');
  });

  it('falls back to public Strapi URL when internal URL is absent', () => {
    envState.STRAPI_URL = 'http://localhost:1337';

    expect(getStrapiServerBaseUrl()).toBe('http://localhost:1337');
  });
});
