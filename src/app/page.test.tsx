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

test('renders hero heading "Náš stát"', async () => {
  const ResolvedPage = await Page();
  render(ResolvedPage);
  const heading = screen.getByRole('heading', { level: 1, name: /náš stát/i });
  expect(heading).toBeInTheDocument();
});

test('"Nahlásit podnět" CTA points to /login when not logged in', async () => {
  const ResolvedPage = await Page();
  render(ResolvedPage);
  const reportLink = screen.getByRole('link', { name: /nahlásit podnět/i });
  expect(reportLink).toHaveAttribute('href', '/login');
});

test('"Nahlásit podnět" CTA points to /reports when logged in', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValueOnce({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
  } as ReturnType<typeof createClient> extends Promise<infer T> ? T : never);

  const ResolvedPage = await Page();
  render(ResolvedPage);
  const reportLink = screen.getByRole('link', { name: /nahlásit podnět/i });
  expect(reportLink).toHaveAttribute('href', '/reports');
});

test('"Prozkoumat mapu" CTA points to /reports', async () => {
  const ResolvedPage = await Page();
  render(ResolvedPage);
  const mapLink = screen.getByRole('link', { name: /prozkoumat mapu/i });
  expect(mapLink).toHaveAttribute('href', '/reports');
});

test('renders three feature card headings: Hlášení, Diskuze, Přehled', async () => {
  const ResolvedPage = await Page();
  render(ResolvedPage);
  expect(screen.getByRole('heading', { level: 2, name: /hlášení/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: /diskuze/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: /přehled/i })).toBeInTheDocument();
});
