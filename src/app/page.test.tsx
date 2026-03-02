import { render, screen } from '@testing-library/react';
import Page from './page';
import { expect, test, vi } from 'vitest';

// Mock Supabase client
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}));

// Mock Next.js headers and navigation
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

test('renders Home page with welcome message', async () => {
  const ResolvedPage = await Page();
  render(ResolvedPage);
  const element = screen.getByText(/Vítejte v aplikaci Náš stát/i);
  expect(element).toBeInTheDocument();
});

test('shows report link pointing to /login when not logged in', async () => {
  const ResolvedPage = await Page();
  render(ResolvedPage);
  const reportLink = screen.getByRole('link', { name: /nahlásit podnět/i });
  expect(reportLink).toHaveAttribute('href', '/login');
});
