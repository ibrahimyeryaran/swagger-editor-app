import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SignInPage from './page';
import SignUpPage from '../signup/page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('@/components/auth/AuthForm', () => ({
  AuthForm: ({ mode }: { mode: string }) => <div data-testid="auth-form">{mode}</div>,
}));

function mockUser(user: { id: string } | null) {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
  } as unknown as Awaited<ReturnType<typeof createClient>>);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('SignInPage', () => {
  it('renders the sign in form for guests', async () => {
    mockUser(null);
    render(await SignInPage());
    expect(screen.getByTestId('auth-form')).toHaveTextContent('signin');
  });

  it('redirects authenticated users to the main page', async () => {
    mockUser({ id: 'user-1' });
    await expect(SignInPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });
});

describe('SignUpPage', () => {
  it('renders the sign up form for guests', async () => {
    mockUser(null);
    render(await SignUpPage());
    expect(screen.getByTestId('auth-form')).toHaveTextContent('signup');
  });

  it('redirects authenticated users to the main page', async () => {
    mockUser({ id: 'user-1' });
    await expect(SignUpPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });
});
