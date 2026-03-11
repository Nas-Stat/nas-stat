import { render, screen } from '@testing-library/react';
import Page from './page';
import { expect, test, vi } from 'vitest';

// Mock Supabase client
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          ascending: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
        eq: vi.fn().mockReturnThis(),
        ascending: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  })),
}));

// Mock Next.js headers and navigation
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock LandingClient to avoid map/dynamic imports in unit test
vi.mock('./LandingClient', () => ({
  default: ({
    statusCounts,
    categories,
    isLoggedIn,
  }: {
    reports: unknown[];
    statusCounts: { status: string; count: number }[];
    categories: { slug: string; label: string }[];
    isLoggedIn: boolean;
  }) => (
    <div data-testid="landing-client">
      <div data-testid="total-count">
        {statusCounts.reduce((s, c) => s + c.count, 0)}
      </div>
      <div data-testid="category-count">{categories.length}</div>
      <div data-testid="is-logged-in">{String(isLoggedIn)}</div>
    </div>
  ),
}));

function buildSupabaseMock(user: { id: string } | null, overrides?: object) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          ascending: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
        eq: vi.fn().mockReturnThis(),
        ascending: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
    ...overrides,
  };
}

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
  vi.mocked(createClient).mockResolvedValueOnce(
    buildSupabaseMock({ id: 'user-1' }) as ReturnType<
      typeof createClient
    > extends Promise<infer T>
      ? T
      : never,
  );

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
  expect(
    screen.getByRole('heading', { level: 2, name: /hlášení/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 2, name: /diskuze/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 2, name: /přehled/i }),
  ).toBeInTheDocument();
});

test('renders LandingClient with isLoggedIn=false when no user', async () => {
  const ResolvedPage = await Page();
  render(ResolvedPage);
  expect(screen.getByTestId('is-logged-in').textContent).toBe('false');
});

test('renders LandingClient with isLoggedIn=true when user logged in', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValueOnce(
    buildSupabaseMock({ id: 'user-1' }) as ReturnType<
      typeof createClient
    > extends Promise<infer T>
      ? T
      : never,
  );

  const ResolvedPage = await Page();
  render(ResolvedPage);
  expect(screen.getByTestId('is-logged-in').textContent).toBe('true');
});

test('passes empty reports and statusCounts when DB returns nothing', async () => {
  const ResolvedPage = await Page();
  render(ResolvedPage);
  expect(screen.getByTestId('total-count').textContent).toBe('0');
  expect(screen.getByTestId('category-count').textContent).toBe('0');
});
