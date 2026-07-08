import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, act } from '@testing-library/react';
import { renderWithIntl } from '../../../test/utils';
import { Header } from './Header';

const replaceMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => '/',
  useRouter: () => ({ replace: replaceMock, push: pushMock, refresh: refreshMock }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  }),
}));

vi.mock('@/components/toast/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows sign in and sign up buttons for guests', () => {
    renderWithIntl(<Header userEmail={null} />);
    expect(screen.getByText('Sign In')).toHaveAttribute('href', '/signin');
    expect(screen.getByText('Sign Up')).toHaveAttribute('href', '/signup');
    expect(screen.queryByText('History')).not.toBeInTheDocument();
  });

  it('shows history and sign out buttons for authenticated users', () => {
    renderWithIntl(<Header userEmail="user@example.com" />);
    expect(screen.getByText('History')).toHaveAttribute('href', '/history');
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  it('links to the about page', () => {
    renderWithIntl(<Header userEmail={null} />);
    expect(screen.getByText('About')).toHaveAttribute('href', '/about');
  });

  it('adds the scrolled style when the window scrolls down', () => {
    renderWithIntl(<Header userEmail={null} />);
    const header = screen.getByTestId('header');
    expect(header.className).not.toContain('scrolled');

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 120, writable: true });
      fireEvent.scroll(window);
    });
    expect(header.className).toContain('scrolled');
  });

  it('switches the locale from the language select', () => {
    renderWithIntl(<Header userEmail={null} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'tr' } });
    expect(replaceMock).toHaveBeenCalledWith('/', { locale: 'tr' });
  });
});
