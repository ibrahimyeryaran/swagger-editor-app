import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createBrowser } from './client';
import { createClient as createServer } from './server';

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => 'browser-client'),
  createServerClient: vi.fn(() => 'server-client'),
}));

const cookieStore = {
  getAll: vi.fn(() => [{ name: 'sb', value: 'token' }]),
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(cookies).mockResolvedValue(
    cookieStore as unknown as Awaited<ReturnType<typeof cookies>>
  );
});

describe('supabase browser client', () => {
  it('creates a browser client with the public env vars', () => {
    expect(createBrowser()).toBe('browser-client');
    expect(createBrowserClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  });
});

describe('supabase server client', () => {
  it('creates a server client wired to the request cookies', async () => {
    expect(await createServer()).toBe('server-client');

    const options = vi.mocked(createServerClient).mock.calls[0][2] as {
      cookies: {
        getAll: () => unknown;
        setAll: (list: { name: string; value: string; options?: object }[]) => void;
      };
    };

    expect(options.cookies.getAll()).toEqual([{ name: 'sb', value: 'token' }]);

    options.cookies.setAll([{ name: 'a', value: 'b', options: {} }]);
    expect(cookieStore.set).toHaveBeenCalledWith('a', 'b', {});
  });

  it('swallows cookie write errors from server components', async () => {
    cookieStore.set.mockImplementation(() => {
      throw new Error('read-only');
    });
    await createServer();
    const options = vi.mocked(createServerClient).mock.calls[0][2] as unknown as {
      cookies: { setAll: (list: { name: string; value: string }[]) => void };
    };
    expect(() => options.cookies.setAll([{ name: 'a', value: 'b' }])).not.toThrow();
  });
});
