import { render, screen } from '@testing-library/react';
import Page from './page';
import { expect, test, vi } from 'vitest';

// Mock Supabase client with logged in user
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
        error: null,
      }),
    },
  })),
}));

// Mock Next.js headers and navigation
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

test('shows report link pointing to /reports when logged in', async () => {
  const ResolvedPage = await Page();
  render(ResolvedPage);
  const reportLink = screen.getByRole('link', { name: /nahlásit podnět/i });
  expect(reportLink).toHaveAttribute('href', '/reports');
});
