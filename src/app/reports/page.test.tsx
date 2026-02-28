import { render, screen } from '@testing-library/react';
import Page from './page';
import { expect, test, vi } from 'vitest';
import { Report } from '@/components/Map';

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  }),
}));

// Mock ReportsClient component
vi.mock('./ReportsClient', () => ({
  default: ({ initialReports }: { initialReports: Report[] }) => (
    <div data-testid="mocked-reports-client">
      Mocked ReportsClient ({initialReports.length} reports)
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

test('renders Reports page with header and reports client', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              title: 'Díra v silnici',
              location: { type: 'Point', coordinates: [14.4, 50.1] },
              rating: 2,
              category: 'Doprava',
              status: 'pending',
            },
          ],
          error: null,
        }),
      }),
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  const header = screen.getByText(/Hlášení podnětů/i);
  expect(header).toBeInTheDocument();

  const reportsClient = screen.getByTestId('mocked-reports-client');
  expect(reportsClient).toBeInTheDocument();
  expect(screen.getByText(/Mocked ReportsClient \(1 reports\)/i)).toBeInTheDocument();
  expect(screen.getByTestId('first-report-title')).toHaveTextContent('Díra v silnici');

  const backButton = screen.getByRole('link', { name: /zpět/i });
  expect(backButton).toHaveAttribute('href', '/');
});
