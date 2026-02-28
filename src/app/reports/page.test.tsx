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
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  }),
}));

// Mock ReportsClient component
vi.mock('./ReportsClient', () => ({
  default: () => <div data-testid="mocked-reports-client">Mocked ReportsClient</div>,
}));

// Mock Lucide-react
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
}));

test('renders Reports page with header and reports client', async () => {
  const PageComponent = await Page();
  render(PageComponent);

  const header = screen.getByText(/Hlášení podnětů/i);
  expect(header).toBeInTheDocument();

  const reportsClient = screen.getByTestId('mocked-reports-client');
  expect(reportsClient).toBeInTheDocument();

  const backButton = screen.getByRole('link', { name: /zpět/i });
  expect(backButton).toHaveAttribute('href', '/');
});
