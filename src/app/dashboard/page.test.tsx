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

// Mock Map component
vi.mock('@/components/Map', () => ({
  default: () => <div data-testid="mock-map">Map</div>,
}));

test('renders Dashboard page with header, map and sections', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') {
        const mockReports = {
          data: [
            { id: '1', title: 'Díra v silnici', rating: 2, category: 'Doprava', created_at: new Date().toISOString(), location: { type: 'Point', coordinates: [14.4, 50.1] } },
          ],
          error: null,
        };
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockReports),
            }),
            // Mock the Promise-like behavior for allReports select
            then: (resolve: (value: { data: typeof mockReports.data; error: null }) => void) => resolve({ data: mockReports.data, error: null }),
          }),
        } as unknown;
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
  expect(screen.getByText(/Geografický pulz/i)).toBeInTheDocument();
  expect(screen.getByTestId('mock-map')).toBeInTheDocument();
  expect(screen.getByText(/Nejnovější hlášení/i)).toBeInTheDocument();
  expect(screen.getByText(/Populární témata/i)).toBeInTheDocument();
  expect(screen.getByText(/Díra v silnici/i)).toBeInTheDocument();
  expect(screen.getByText(/Nová reforma/i)).toBeInTheDocument();
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
  expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2); // Total reports and Resolved count
  expect(screen.getByText(/0.0 \/ 5/)).toBeInTheDocument(); // Avg rating
});

test('calculates and displays correct statistics', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') {
        const mockReports = [
          { id: '1', title: 'R1', rating: 5, category: 'C1', created_at: '2026-01-01', location: { type: 'Point', coordinates: [14.4, 50.1] }, status: 'resolved' },
          { id: '2', title: 'R2', rating: 1, category: 'C2', created_at: '2026-01-02', location: { type: 'Point', coordinates: [14.4, 50.1] }, status: 'pending' },
        ];
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockReports, error: null }),
            }),
            then: (resolve: (value: { data: typeof mockReports; error: null }) => void) => resolve({ data: mockReports, error: null }),
          }),
        } as unknown;
      }
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  // Average of 5 and 1 is 3.0
  expect(screen.getByText(/3.0 \/ 5/)).toBeInTheDocument();
  // Total reports = 2
  expect(screen.getByText('2')).toBeInTheDocument();
  // Resolved count = 1
  expect(screen.getByText('1')).toBeInTheDocument();
});
