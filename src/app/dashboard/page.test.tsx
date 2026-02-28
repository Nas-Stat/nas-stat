import { render, screen } from '@testing-library/react';
import Page from './page';
import { expect, test, vi } from 'vitest';

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

// Mock Lucide-react
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  MessageSquare: () => <div data-testid="message-square-icon">MessageSquare</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  MapPin: () => <div data-testid="map-pin-icon">MapPin</div>,
  LayoutDashboard: () => <div data-testid="dashboard-icon">LayoutDashboard</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
}));

test('renders Dashboard page with header and sections', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  { id: '1', title: 'Díra v silnici', rating: 2, category: 'Doprava', created_at: new Date().toISOString() },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'topics') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  { id: '1', title: 'Nová reforma', comments: [{ id: '1' }], created_at: new Date().toISOString() },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByText(/Pulse Dashboard/i)).toBeInTheDocument();
  expect(screen.getByText(/Nejnovější hlášení/i)).toBeInTheDocument();
  expect(screen.getByText(/Populární témata/i)).toBeInTheDocument();
  expect(screen.getByText(/Díra v silnici/i)).toBeInTheDocument();
  expect(screen.getByText(/Nová reforma/i)).toBeInTheDocument();

  const backButton = screen.getByRole('link', { name: /zpět/i });
  expect(backButton).toHaveAttribute('href', '/');
});

test('renders empty state when no data is available', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByText(/Zatím žádná hlášení/i)).toBeInTheDocument();
  expect(screen.getByText(/Zatím žádná témata/i)).toBeInTheDocument();
  expect(screen.getByText(/0 /)).toBeInTheDocument(); // Total reports count
  expect(screen.getByText(/0.0 \/ 5/)).toBeInTheDocument(); // Avg rating
});
