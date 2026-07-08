import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createTranslator } from '../../../../test/utils';
import AboutPage from './page';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (namespace: string) => createTranslator(namespace)),
}));

describe('AboutPage', () => {
  it('shows project, course, team and technology information', async () => {
    render(await AboutPage());

    expect(screen.getByText('Swagger Editor App')).toBeInTheDocument();
    expect(screen.getByText('RS School React Course')).toBeInTheDocument();
    expect(screen.getByText(/final task of the RS School React course/)).toBeInTheDocument();

    expect(screen.getByText('İbrahim Yeryaran')).toBeInTheDocument();
    expect(screen.getByText('Team lead & developer')).toBeInTheDocument();
    expect(screen.getByText('GitHub profile')).toHaveAttribute(
      'href',
      'https://github.com/ibrahimyeryaran'
    );

    expect(screen.getByText('Next.js 15 (App Router)')).toBeInTheDocument();
    expect(screen.getByText('Supabase (Auth + Postgres)')).toBeInTheDocument();
  });
});
