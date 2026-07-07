// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, PUT } from './route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

interface QueryMocks {
  maybeSingle?: ReturnType<typeof vi.fn>;
  upsert?: ReturnType<typeof vi.fn>;
}

function mockSupabase(user: { id: string } | null, mocks: QueryMocks = {}) {
  const maybeSingle = mocks.maybeSingle ?? vi.fn().mockResolvedValue({ data: null, error: null });
  const upsert = mocks.upsert ?? vi.fn().mockResolvedValue({ error: null });
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
      upsert,
    })),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { maybeSingle, upsert };
}

function putRequest(payload: unknown): Request {
  return new Request('http://localhost/api/schema', {
    method: 'PUT',
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/schema', () => {
  it('returns 401 for unauthenticated users', async () => {
    mockSupabase(null);
    expect((await GET()).status).toBe(401);
  });

  it('returns the saved schema for the current user', async () => {
    mockSupabase(
      { id: 'user-1' },
      {
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: { content: 'openapi: 3.0.0', format: 'yaml' }, error: null }),
      }
    );
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).schema).toEqual({ content: 'openapi: 3.0.0', format: 'yaml' });
  });

  it('returns 500 when the database query fails', async () => {
    mockSupabase(
      { id: 'user-1' },
      { maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }) }
    );
    expect((await GET()).status).toBe(500);
  });
});

describe('PUT /api/schema', () => {
  it('returns 401 for unauthenticated users', async () => {
    mockSupabase(null);
    const response = await PUT(putRequest({ content: 'x', format: 'yaml' }));
    expect(response.status).toBe(401);
  });

  it('rejects invalid JSON and invalid payloads', async () => {
    mockSupabase({ id: 'user-1' });
    expect((await PUT(putRequest('nope'))).status).toBe(400);
    expect((await PUT(putRequest({ content: '', format: 'yaml' }))).status).toBe(400);
    expect((await PUT(putRequest({ content: 'x', format: 'xml' }))).status).toBe(400);
  });

  it('saves the schema for the current user', async () => {
    const { upsert } = mockSupabase({ id: 'user-1' });
    const response = await PUT(putRequest({ content: 'openapi: 3.0.0', format: 'yaml' }));

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', content: 'openapi: 3.0.0', format: 'yaml' })
    );
  });

  it('returns 500 when saving fails', async () => {
    mockSupabase(
      { id: 'user-1' },
      { upsert: vi.fn().mockResolvedValue({ error: { message: 'boom' } }) }
    );
    const response = await PUT(putRequest({ content: 'x', format: 'json' }));
    expect(response.status).toBe(500);
  });
});
