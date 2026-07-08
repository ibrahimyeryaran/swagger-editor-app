import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoryPage from './page';
import HistoryDetailPage from './[id]/page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/navigation';
import { createTranslator } from '../../../../test/utils';
import type { HistoryRow } from '@/lib/history';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (namespace: string) => createTranslator(namespace)),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const rows: HistoryRow[] = [
  {
    id: 'r2',
    method: 'POST',
    url: 'https://api.example.com/posts',
    status_code: 201,
    duration_ms: 350,
    request_size: 42,
    response_size: 120,
    error: null,
    created_at: '2026-07-02T09:00:00Z',
  },
  {
    id: 'r1',
    method: 'GET',
    url: 'https://api.example.com/posts/1',
    status_code: 404,
    duration_ms: 90,
    request_size: 0,
    response_size: 15,
    error: null,
    created_at: '2026-07-01T09:00:00Z',
  },
];

function mockSupabase(user: { id: string } | null, data: HistoryRow[] | HistoryRow | null) {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data }),
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data }),
        })),
      })),
    })),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
}

const params = Promise.resolve({ locale: 'en' });
const detailParams = Promise.resolve({ locale: 'en', id: 'r1' });

afterEach(() => {
  vi.clearAllMocks();
});

describe('HistoryPage', () => {
  it('redirects unauthenticated users to the main page', async () => {
    mockSupabase(null, []);
    await expect(HistoryPage({ params })).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith({ href: '/', locale: 'en' });
  });

  it('shows an informational empty state with links to the editor and viewer', async () => {
    mockSupabase({ id: 'user-1' }, []);
    render(await HistoryPage({ params }));

    expect(screen.getByText("You haven't executed any requests yet")).toBeInTheDocument();
    expect(screen.getByText('Go to the Editor')).toHaveAttribute('href', '/');
    expect(screen.getByText('Go to the Viewer')).toHaveAttribute('href', '/');
  });

  it('renders analytics and the request table with detail links', async () => {
    mockSupabase({ id: 'user-1' }, rows);
    render(await HistoryPage({ params }));

    expect(screen.getByText('Total requests')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('220 ms')).toBeInTheDocument();

    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('https://api.example.com/posts')).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();

    const detailLinks = screen.getAllByText('Details');
    expect(detailLinks[0]).toHaveAttribute('href', '/history/r2');
    expect(detailLinks[1]).toHaveAttribute('href', '/history/r1');
  });
});

describe('HistoryDetailPage', () => {
  it('redirects unauthenticated users to the main page', async () => {
    mockSupabase(null, null);
    await expect(HistoryDetailPage({ params: detailParams })).rejects.toThrow('NEXT_REDIRECT');
  });

  it('shows all recorded analytics for a request', async () => {
    mockSupabase({ id: 'user-1' }, rows[1]);
    render(await HistoryDetailPage({ params: detailParams }));

    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('https://api.example.com/posts/1')).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('90 ms')).toBeInTheDocument();
    expect(screen.getByText('0 B')).toBeInTheDocument();
    expect(screen.getByText('15 B')).toBeInTheDocument();
    expect(screen.getByText('Error details')).toBeInTheDocument();
  });

  it('shows a not found message for missing requests', async () => {
    mockSupabase({ id: 'user-1' }, null);
    render(await HistoryDetailPage({ params: detailParams }));
    expect(screen.getByText('Request not found')).toBeInTheDocument();
  });
});
