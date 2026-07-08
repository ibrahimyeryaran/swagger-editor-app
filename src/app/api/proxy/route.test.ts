// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

interface SupabaseMockOptions {
  user?: { id: string } | null;
  insert?: ReturnType<typeof vi.fn>;
}

function mockSupabase({
  user = null,
  insert = vi.fn().mockResolvedValue({}),
}: SupabaseMockOptions = {}) {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn(() => ({ insert })),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { insert };
}

function proxyRequest(payload: unknown): Request {
  return new Request('http://localhost/api/proxy', {
    method: 'POST',
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

describe('POST /api/proxy', () => {
  beforeEach(() => {
    mockSupabase();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('rejects invalid JSON bodies', async () => {
    const response = await POST(proxyRequest('not json'));
    expect(response.status).toBe(400);
  });

  it('rejects payloads without a url or method', async () => {
    expect((await POST(proxyRequest({ url: 'https://a.com' }))).status).toBe(400);
    expect((await POST(proxyRequest({ method: 'GET' }))).status).toBe(400);
  });

  it('rejects unsupported protocols, methods and malformed urls', async () => {
    expect(
      (await POST(proxyRequest({ url: 'ftp://files.example.com', method: 'GET' }))).status
    ).toBe(400);
    expect((await POST(proxyRequest({ url: 'https://a.com', method: 'BREW' }))).status).toBe(400);
    expect((await POST(proxyRequest({ url: 'not a url', method: 'GET' }))).status).toBe(400);
    expect(
      (await POST(proxyRequest({ url: 'https://a.com', method: 'GET', headers: { a: 1 } }))).status
    ).toBe(400);
    expect(
      (await POST(proxyRequest({ url: 'https://a.com', method: 'GET', body: 42 }))).status
    ).toBe(400);
  });

  it('forwards the request and returns status, headers, body and sizes', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('{"id":1}', {
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
      })
    );

    const response = await POST(
      proxyRequest({
        url: 'https://api.example.com/posts',
        method: 'post',
        headers: { 'Content-Type': 'application/json', host: 'evil.com' },
        body: '{"title":"hi"}',
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.status).toBe(201);
    expect(data.body).toBe('{"id":1}');
    expect(data.headers['content-type']).toBe('application/json');
    expect(data.requestSize).toBe(14);
    expect(data.responseSize).toBe(8);
    expect(data.durationMs).toBeGreaterThanOrEqual(0);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://api.example.com/posts');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>)['host']).toBeUndefined();
    expect(init?.body).toBe('{"title":"hi"}');
  });

  it('does not attach a body to GET requests', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('ok'));
    await POST(proxyRequest({ url: 'https://api.example.com', method: 'GET', body: 'ignored' }));
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.body).toBeUndefined();
  });

  it('returns network failures as a non-ok result with the error message', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    const response = await POST(proxyRequest({ url: 'https://down.example.com', method: 'GET' }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('ENOTFOUND');
  });

  it('records analytics for authenticated users', async () => {
    const { insert } = mockSupabase({ user: { id: 'user-1' } });
    vi.mocked(fetch).mockResolvedValue(new Response('body', { status: 200 }));

    await POST(proxyRequest({ url: 'https://api.example.com', method: 'GET' }));

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        method: 'GET',
        url: 'https://api.example.com',
        status_code: 200,
        response_size: 4,
        error: null,
      })
    );
  });

  it('does not record analytics for guests', async () => {
    const { insert } = mockSupabase({ user: null });
    vi.mocked(fetch).mockResolvedValue(new Response('body'));

    await POST(proxyRequest({ url: 'https://api.example.com', method: 'GET' }));

    expect(insert).not.toHaveBeenCalled();
  });

  it('still returns the response when analytics recording throws', async () => {
    vi.mocked(createClient).mockRejectedValue(new Error('db down'));
    vi.mocked(fetch).mockResolvedValue(new Response('body'));

    const response = await POST(proxyRequest({ url: 'https://api.example.com', method: 'GET' }));
    expect((await response.json()).ok).toBe(true);
  });
});
