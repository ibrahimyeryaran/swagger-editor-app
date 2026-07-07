import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithIntl } from '../../../test/utils';
import { AuthForm } from './AuthForm';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const signInMock = vi.fn();
const signUpMock = vi.fn();
const showToastMock = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: signInMock, signUp: signUpMock },
  }),
}));

vi.mock('@/components/toast/ToastProvider', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

function fillForm(email: string, password: string, confirm?: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  if (confirm !== undefined) {
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: confirm } });
  }
}

describe('AuthForm sign in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors before submitting', async () => {
    renderWithIntl(<AuthForm mode="signin" />);
    fillForm('not-an-email', 'weak');
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('redirects to the main page after a successful login', async () => {
    signInMock.mockResolvedValue({ data: { session: {} }, error: null });
    renderWithIntl(<AuthForm mode="signin" />);
    fillForm('user@example.com', 'abcdef1!');
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() =>
      expect(signInMock).toHaveBeenCalledWith({ email: 'user@example.com', password: 'abcdef1!' })
    );
    expect(pushMock).toHaveBeenCalledWith('/');
    expect(refreshMock).toHaveBeenCalled();
  });

  it('shows the server error when login fails', async () => {
    signInMock.mockResolvedValue({ data: {}, error: { message: 'Invalid credentials' } });
    renderWithIntl(<AuthForm mode="signin" />);
    fillForm('user@example.com', 'abcdef1!');
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(showToastMock).toHaveBeenCalledWith('Invalid credentials', 'error');
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe('AuthForm sign up', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates that passwords match', async () => {
    renderWithIntl(<AuthForm mode="signup" />);
    fillForm('user@example.com', 'abcdef1!', 'different1!');
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it('signs up and redirects to the main page when a session is created', async () => {
    signUpMock.mockResolvedValue({ data: { session: {} }, error: null });
    renderWithIntl(<AuthForm mode="signup" />);
    fillForm('user@example.com', 'abcdef1!', 'abcdef1!');
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
    expect(showToastMock).toHaveBeenCalledWith('Account created successfully', 'success');
  });

  it('asks for email confirmation when no session is returned', async () => {
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    renderWithIntl(<AuthForm mode="signup" />);
    fillForm('user@example.com', 'abcdef1!', 'abcdef1!');
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/signin'));
    expect(showToastMock).toHaveBeenCalledWith(
      'Account created. Please check your inbox to confirm your email, then sign in.',
      'info'
    );
  });
});
