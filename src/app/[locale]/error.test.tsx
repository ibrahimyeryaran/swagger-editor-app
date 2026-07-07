import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithIntl } from '../../../test/utils';
import ErrorPage from './error';
import NotFoundPage from './not-found';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('ErrorPage', () => {
  it('shows a friendly message and retries on click', () => {
    const reset = vi.fn();
    renderWithIntl(<ErrorPage error={new Error('boom')} reset={reset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Try again'));
    expect(reset).toHaveBeenCalled();
  });
});

describe('NotFoundPage', () => {
  it('shows a not found message with a link home', () => {
    renderWithIntl(<NotFoundPage />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByText('Go to the main page')).toHaveAttribute('href', '/');
  });
});
