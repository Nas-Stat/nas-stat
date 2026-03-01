import { render, screen } from '@testing-library/react';
import Page from './page';
import { expect, test, vi, describe } from 'vitest';
import { Report } from '@/components/Map';

// Chainable query builder factory
function makeQueryBuilder(result: { data: unknown[]; error: null; count: number }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue(result),
  };
  return builder;
}

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue(
      makeQueryBuilder({ data: [], error: null, count: 0 })
    ),
  }),
}));

// Mock ReportsClient component
vi.mock('./ReportsClient', () => ({
  default: ({
    initialReports,
    currentPage,
    totalPages,
    currentStatus,
    currentCategory,
  }: {
    initialReports: Report[];
    currentPage: number;
    totalPages: number;
    currentStatus: string;
    currentCategory: string;
  }) => (
    <div data-testid="mocked-reports-client">
      Mocked ReportsClient ({initialReports.length} reports)
      <span data-testid="current-page">{currentPage}</span>
      <span data-testid="total-pages">{totalPages}</span>
      <span data-testid="current-status">{currentStatus}</span>
      <span data-testid="current-category">{currentCategory}</span>
      {initialReports.length > 0 && (
        <span data-testid="first-report-title">{initialReports[0].title}</span>
      )}
    </div>
  ),
}));

// Mock Lucide-react
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
}));

describe('ReportsPage', () => {
  test('renders page header and reports client with default params', async () => {
    const { createClient } = await import('@/utils/supabase/server');
    const qb = makeQueryBuilder({
      data: [
        {
          id: '1',
          title: 'Díra v silnici',
          location: { type: 'Point', coordinates: [14.4, 50.1] },
          rating: 2,
          category: 'Doprava',
          status: 'pending',
          description: null,
          created_at: '2026-03-01T00:00:00Z',
        },
      ],
      error: null,
      count: 1,
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn().mockReturnValue(qb),
    } as unknown as ReturnType<typeof createClient>);

    const PageComponent = await Page({
      searchParams: Promise.resolve({}),
    });
    render(PageComponent);

    expect(screen.getByText(/Hlášení podnětů/i)).toBeInTheDocument();
    expect(screen.getByTestId('mocked-reports-client')).toBeInTheDocument();
    expect(screen.getByText(/Mocked ReportsClient \(1 reports\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('first-report-title')).toHaveTextContent('Díra v silnici');
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    expect(screen.getByTestId('total-pages')).toHaveTextContent('1');
    expect(screen.getByTestId('current-status')).toHaveTextContent('');
    expect(screen.getByTestId('current-category')).toHaveTextContent('');

    const backButton = screen.getByRole('link', { name: /zpět/i });
    expect(backButton).toHaveAttribute('href', '/');
  });

  test('passes status and category filters from searchParams', async () => {
    const { createClient } = await import('@/utils/supabase/server');
    const qb = makeQueryBuilder({ data: [], error: null, count: 0 });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn().mockReturnValue(qb),
    } as unknown as ReturnType<typeof createClient>);

    const PageComponent = await Page({
      searchParams: Promise.resolve({ status: 'pending', category: 'Doprava' }),
    });
    render(PageComponent);

    expect(screen.getByTestId('current-status')).toHaveTextContent('pending');
    expect(screen.getByTestId('current-category')).toHaveTextContent('Doprava');
    // eq() called twice — once for status, once for category
    expect(qb.eq).toHaveBeenCalledWith('status', 'pending');
    expect(qb.eq).toHaveBeenCalledWith('category', 'Doprava');
  });

  test('computes totalPages correctly from count', async () => {
    const { createClient } = await import('@/utils/supabase/server');
    const qb = makeQueryBuilder({ data: [], error: null, count: 45 });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn().mockReturnValue(qb),
    } as unknown as ReturnType<typeof createClient>);

    const PageComponent = await Page({
      searchParams: Promise.resolve({ page: '2' }),
    });
    render(PageComponent);

    // 45 reports / 20 per page = 3 pages
    expect(screen.getByTestId('total-pages')).toHaveTextContent('3');
    expect(screen.getByTestId('current-page')).toHaveTextContent('2');
    // range called with offset=20, limit end=39
    expect(qb.range).toHaveBeenCalledWith(20, 39);
  });

  test('clamps invalid page to 1', async () => {
    const { createClient } = await import('@/utils/supabase/server');
    const qb = makeQueryBuilder({ data: [], error: null, count: 0 });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn().mockReturnValue(qb),
    } as unknown as ReturnType<typeof createClient>);

    const PageComponent = await Page({
      searchParams: Promise.resolve({ page: '-5' }),
    });
    render(PageComponent);

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    expect(qb.range).toHaveBeenCalledWith(0, 19);
  });

  test('does not call eq() when no filters provided', async () => {
    const { createClient } = await import('@/utils/supabase/server');
    const qb = makeQueryBuilder({ data: [], error: null, count: 0 });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn().mockReturnValue(qb),
    } as unknown as ReturnType<typeof createClient>);

    await Page({ searchParams: Promise.resolve({}) });

    expect(qb.eq).not.toHaveBeenCalled();
    expect(qb.range).toHaveBeenCalledWith(0, 19);
  });
});
