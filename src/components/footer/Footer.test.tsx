import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../../test/utils';
import { Footer } from './Footer';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('Footer', () => {
  it('shows the about link and course link', () => {
    renderWithIntl(<Footer />);
    expect(screen.getByText('About')).toHaveAttribute('href', '/about');
    expect(screen.getByText('RS School React Course')).toHaveAttribute(
      'href',
      'https://rs.school/courses/reactjs'
    );
  });

  it('shows the copyright with the current year', () => {
    renderWithIntl(<Footer />);
    expect(
      screen.getByText(`© ${new Date().getFullYear()} swagger-editor-app`)
    ).toBeInTheDocument();
  });
});
