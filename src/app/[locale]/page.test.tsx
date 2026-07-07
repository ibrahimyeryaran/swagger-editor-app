import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import { DEFAULT_SPEC } from '@/lib/openapi/default-spec';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/components/workspace/Workspace', () => ({
  Workspace: (props: { initialContent: string; isAuthenticated: boolean; restored: boolean }) => (
    <div
      data-testid="workspace"
      data-authenticated={props.isAuthenticated}
      data-restored={props.restored}
    >
      {props.initialContent}
    </div>
  ),
}));

function mockSupabase(user: { id: string } | null, savedSchema: { content: string } | null = null) {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: savedSchema, error: null }),
        })),
      })),
    })),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('HomePage', () => {
  it('loads the default schema for guests', async () => {
    mockSupabase(null);
    render(await HomePage());

    const workspace = screen.getByTestId('workspace');
    expect(workspace).toHaveTextContent('JSONPlaceholder API');
    expect(workspace.dataset.authenticated).toBe('false');
    expect(workspace.dataset.restored).toBe('false');
  });

  it('restores the saved schema for authenticated users', async () => {
    mockSupabase({ id: 'user-1' }, { content: 'openapi: 3.0.0 # saved' });
    render(await HomePage());

    const workspace = screen.getByTestId('workspace');
    expect(workspace).toHaveTextContent('openapi: 3.0.0 # saved');
    expect(workspace.dataset.authenticated).toBe('true');
    expect(workspace.dataset.restored).toBe('true');
  });

  it('falls back to the default schema when the user has no saved schema', async () => {
    mockSupabase({ id: 'user-1' }, null);
    render(await HomePage());

    const workspace = screen.getByTestId('workspace');
    expect(workspace.textContent).toBe(DEFAULT_SPEC);
    expect(workspace.dataset.restored).toBe('false');
  });
});
