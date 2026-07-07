import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithIntl } from '../../../test/utils';
import { SignOutButton } from './SignOutButton';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const signOutMock = vi.fn();
const showToastMock = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signOut: signOutMock } }),
}));

vi.mock('@/components/toast/ToastProvider', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs out and navigates to the main page', async () => {
    signOutMock.mockResolvedValue({ error: null });
    renderWithIntl(<SignOutButton />);

    fireEvent.click(screen.getByText('Sign Out'));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
    expect(refreshMock).toHaveBeenCalled();
    expect(showToastMock).not.toHaveBeenCalled();
  });

  it('shows a toast when sign out fails', async () => {
    signOutMock.mockResolvedValue({ error: { message: 'nope' } });
    renderWithIntl(<SignOutButton />);

    fireEvent.click(screen.getByText('Sign Out'));

    await waitFor(() => expect(showToastMock).toHaveBeenCalled());
    expect(pushMock).not.toHaveBeenCalled();
  });
});
