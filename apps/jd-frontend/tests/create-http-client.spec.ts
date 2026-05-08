/**
 * createHttpClient 单元测试
 *
 * Mock fetch 验证 URL 拼接、header 合并、超时 abort、错误映射
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHttpClient } from '@/infrastructure/api/pipeline/create-client';
import {
  ApiError,
  AuthenticationError,
  MagentoServiceError,
  ServerError,
  TimeoutError,
  NetworkError,
} from '@/infrastructure/api/errors';

// ── Helpers ──────────────────────────────────────────

function mockFetch(
  status: number,
  body: unknown,
  headers?: Record<string, string>
) {
  const res = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 400 ? 'Error' : 'OK',
    headers: new Headers({ 'Content-Type': 'application/json', ...headers }),
    json: vi.fn().mockResolvedValue(body),
    text: vi
      .fn()
      .mockResolvedValue(
        typeof body === 'string' ? body : JSON.stringify(body)
      ),
    clone() {
      return this;
    },
  };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res));
  return res;
}

function getFetchCalls() {
  const mock = vi.mocked(
    globalThis.fetch as unknown as ReturnType<typeof vi.fn>
  );
  return mock?.mock?.calls ?? [];
}

function getLastFetchUrl(): string {
  const calls = getFetchCalls();
  return (calls[calls.length - 1]?.[0] as string) ?? '';
}

function getLastFetchInit(): RequestInit {
  const calls = getFetchCalls();
  return (calls[calls.length - 1]?.[1] as RequestInit) ?? {};
}

// ── Tests ────────────────────────────────────────────

describe('createHttpClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── URL ──────────────────────────────────────────

  it('sends request to correct URL (slash normalization)', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com/',
      timeout: 5000,
    });

    await client.get('/products');
    expect(getLastFetchUrl()).toBe('https://api.example.com/products');

    await client.get('products');
    expect(getLastFetchUrl()).toBe('https://api.example.com/products');
  });

  it('handles baseURL without trailing slash', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    await client.get('/products');
    expect(getLastFetchUrl()).toBe('https://api.example.com/products');
  });

  // ── Headers ───────────────────────────────────────

  it('merges default and request headers', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      defaultHeaders: { 'X-Default': 'true' },
    });

    await client.get('/test', { headers: { 'X-Custom': 'custom-value' } });
    const init = getLastFetchInit();
    expect((init.headers as Headers).get('x-default')).toBe('true');
    expect((init.headers as Headers).get('x-custom')).toBe('custom-value');
  });

  it('sets Content-Type only when body present', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    // GET without body → no Content-Type
    await client.get('/test');
    const getInit = getLastFetchInit();
    expect((getInit.headers as Headers).has('content-type')).toBe(false);

    // POST with body → Content-Type: application/json
    mockFetch(200, { ok: true });
    await client.post('/test', { body: { foo: 'bar' } });
    const postInit = getLastFetchInit();
    expect((postInit.headers as Headers).get('content-type')).toBe(
      'application/json'
    );
  });

  it('does not override explicit Content-Type', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    await client.post('/test', {
      body: 'raw-text',
      headers: { 'Content-Type': 'text/plain' },
    });
    const init = getLastFetchInit();
    expect((init.headers as Headers).get('content-type')).toBe('text/plain');
  });

  // ── Auth ──────────────────────────────────────────

  it('injects auth token from getToken()', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      auth: { getToken: () => 'test-token-123' },
    });

    await client.get('/secure');
    const init = getLastFetchInit();
    expect((init.headers as Headers).get('authorization')).toBe(
      'Bearer test-token-123'
    );
  });

  it('supports async getToken()', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      auth: { getToken: async () => 'async-token-456' },
    });

    await client.get('/secure');
    const init = getLastFetchInit();
    expect((init.headers as Headers).get('authorization')).toBe(
      'Bearer async-token-456'
    );
  });

  it('does not set Authorization when getToken returns empty', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      auth: { getToken: () => '' },
    });

    await client.get('/public');
    const init = getLastFetchInit();
    expect((init.headers as Headers).has('authorization')).toBe(false);
  });

  // ── Error Mapping ─────────────────────────────────

  it('maps 401 → AuthenticationError', async () => {
    mockFetch(401, { error: 'Unauthorized' });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    await expect(client.get('/test')).rejects.toThrow(AuthenticationError);
  });

  it('maps 502 → MagentoServiceError', async () => {
    mockFetch(502, 'Bad Gateway');
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    await expect(client.get('/test')).rejects.toThrow(MagentoServiceError);
  });

  it('maps 5xx → ServerError', async () => {
    mockFetch(503, 'Service Unavailable');
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    await expect(client.get('/test')).rejects.toThrow(ServerError);
  });

  it('maps unknown status → ApiError', async () => {
    mockFetch(418, "I'm a teapot");
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    await expect(client.get('/test')).rejects.toThrow(ApiError);
  });

  // ── Timeout ───────────────────────────────────────

  it('aborts after timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise((_, reject) => {
            // Abort causes the fetch to reject with AbortError
            init?.signal?.addEventListener('abort', () => {
              const err = new DOMException(
                'The operation was aborted',
                'AbortError'
              );
              reject(err);
            });
          })
      )
    );

    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 50, // Very short timeout
    });

    await expect(client.get('/slow')).rejects.toThrow(TimeoutError);
  });

  // ── Body serialization ────────────────────────────

  it('serializes object body to JSON string', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    await client.post('/test', { body: { name: 'test', value: 123 } });
    const init = getLastFetchInit();
    expect(init.body).toBe('{"name":"test","value":123}');
  });

  it('preserves string body as-is', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    await client.post('/test', { body: 'raw string' });
    const init = getLastFetchInit();
    expect(init.body).toBe('raw string');
  });

  // ── Network Error ─────────────────────────────────

  it('maps TypeError to NetworkError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed'))
    );

    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    await expect(client.get('/test')).rejects.toThrow(NetworkError);
  });

  // ── Retry ─────────────────────────────────────────

  it('retries on configured status codes', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        calls++;
        if (calls <= 2) {
          return Promise.resolve({
            ok: false,
            status: 502,
            statusText: 'Bad Gateway',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: vi.fn().mockResolvedValue({ error: 'down' }),
            text: vi.fn().mockResolvedValue('Bad Gateway'),
            clone() {
              return this;
            },
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: vi.fn().mockResolvedValue({ ok: true }),
          text: vi.fn().mockResolvedValue('{"ok":true}'),
          clone() {
            return this;
          },
        });
      })
    );

    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      retry: { maxRetries: 2, onStatus: [502] },
    });

    const result = await client.get('/test');
    expect(result).toEqual({ ok: true });
    expect(calls).toBe(3); // 2 failures + 1 success
  });

  it('does not retry on success', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        calls++;
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: vi.fn().mockResolvedValue({ ok: true }),
          text: vi.fn().mockResolvedValue('{"ok":true}'),
          clone() {
            return this;
          },
        });
      })
    );

    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      retry: { maxRetries: 3, onStatus: [502] },
    });

    await client.get('/test');
    expect(calls).toBe(1);
  });

  // ── HTTP Methods ──────────────────────────────────

  it('sends correct HTTP method', async () => {
    mockFetch(200, { ok: true });
    const client = createHttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    await client.get('/g');
    expect(getLastFetchInit().method).toBe('GET');

    await client.post('/p', { body: {} });
    expect(getLastFetchInit().method).toBe('POST');

    await client.put('/u', { body: {} });
    expect(getLastFetchInit().method).toBe('PUT');

    await client.delete('/d');
    expect(getLastFetchInit().method).toBe('DELETE');
  });
});
