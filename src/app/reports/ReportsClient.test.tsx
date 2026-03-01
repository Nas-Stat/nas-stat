import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportsClient from './ReportsClient';
import { expect, test, vi, beforeEach, describe } from 'vitest';
import { User } from '@supabase/supabase-js';

// Mock Map component
vi.mock('@/components/Map', () => ({
  default: ({ onMapClick }: { onMapClick?: (lng: number, lat: number) => void }) => (
    <div data-testid="mocked-map" onClick={() => onMapClick?.(14.4378, 50.0755)}>
      Mocked Map
    </div>
  ),
}));

// Mock Server Actions
vi.mock('./actions', () => ({
  createReport: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Lucide-react
vi.mock('lucide-react', () => ({
  Star: () => <div data-testid="star-icon">Star</div>,
  X: () => <div data-testid="x-icon">X</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
  ChevronLeft: () => <span data-testid="chevron-left-icon">Prev</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">Next</span>,
}));

// Mock next/navigation
const mockRefresh = vi.fn();
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: mockPush,
  }),
}));

const DEFAULT_PROPS = {
  initialReports: [],
  user: null,
  currentPage: 1,
  totalPages: 1,
  currentStatus: '',
  currentCategory: '',
};

describe('ReportsClient', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' } as Partial<User> as User;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Existing map/form tests ---

  test('renders map and initial state', () => {
    render(<ReportsClient {...DEFAULT_PROPS} />);
    expect(screen.getByTestId('mocked-map')).toBeInTheDocument();
    expect(screen.getByText(/Pro nahlášení podnětu se prosím/i)).toBeInTheDocument();
  });

  test('shows form when map is clicked (logged in)', () => {
    render(<ReportsClient {...DEFAULT_PROPS} user={mockUser} />);
    fireEvent.click(screen.getByTestId('mocked-map'));
    expect(screen.getByText(/Nový podnět/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Název podnětu/i)).toBeInTheDocument();
  });

  test('does not show form when map is clicked (logged out)', () => {
    render(<ReportsClient {...DEFAULT_PROPS} user={null} />);
    fireEvent.click(screen.getByTestId('mocked-map'));
    expect(screen.queryByText(/Nový podnět/i)).not.toBeInTheDocument();
  });

  test('closes form when X is clicked', () => {
    render(<ReportsClient {...DEFAULT_PROPS} user={mockUser} />);
    fireEvent.click(screen.getByTestId('mocked-map'));
    expect(screen.getByText(/Nový podnět/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('x-icon'));
    expect(screen.queryByText(/Nový podnět/i)).not.toBeInTheDocument();
  });

  test('submits form successfully', async () => {
    const { createReport } = await import('./actions');
    render(<ReportsClient {...DEFAULT_PROPS} user={mockUser} />);

    fireEvent.click(screen.getByTestId('mocked-map'));
    fireEvent.change(screen.getByLabelText(/Název podnětu/i), { target: { value: 'Test report', name: 'title' } });
    fireEvent.change(screen.getByLabelText(/Popis/i), { target: { value: 'Test description', name: 'description' } });

    const form = screen.getByText(/Odeslat hlášení/i).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createReport).toHaveBeenCalled();
    });

    const formData = vi.mocked(createReport).mock.calls[0][0];
    expect(formData.get('title')).toBe('Test report');
    expect(formData.get('description')).toBe('Test description');
    expect(formData.get('lng')).toBe('14.4378');
    expect(formData.get('lat')).toBe('50.0755');

    await waitFor(() => {
      expect(screen.queryByText(/Nový podnět/i)).not.toBeInTheDocument();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('displays error message when submission fails', async () => {
    const { createReport } = await import('./actions');
    vi.mocked(createReport).mockRejectedValueOnce(new Error('Chyba při ukládání'));

    render(<ReportsClient {...DEFAULT_PROPS} user={mockUser} />);
    fireEvent.click(screen.getByTestId('mocked-map'));
    fireEvent.change(screen.getByLabelText(/Název podnětu/i), { target: { value: 'Test report', name: 'title' } });

    const form = screen.getByText(/Odeslat hlášení/i).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createReport).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Chyba při ukládání')).toBeInTheDocument();
      expect(screen.getByText(/Nový podnět/i)).toBeInTheDocument();
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  // --- Filter tests ---

  test('renders filter bar with status and category selects', () => {
    render(<ReportsClient {...DEFAULT_PROPS} />);
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    expect(screen.getByLabelText(/Filtrovat podle stavu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Filtrovat podle kategorie/i)).toBeInTheDocument();
  });

  test('status select reflects currentStatus prop', () => {
    render(<ReportsClient {...DEFAULT_PROPS} currentStatus="pending" />);
    const select = screen.getByLabelText(/Filtrovat podle stavu/i) as HTMLSelectElement;
    expect(select.value).toBe('pending');
  });

  test('category select reflects currentCategory prop', () => {
    render(<ReportsClient {...DEFAULT_PROPS} currentCategory="Doprava" />);
    const select = screen.getByLabelText(/Filtrovat podle kategorie/i) as HTMLSelectElement;
    expect(select.value).toBe('Doprava');
  });

  test('changing status navigates to filtered URL with page reset', () => {
    render(
      <ReportsClient
        {...DEFAULT_PROPS}
        currentPage={3}
        currentStatus=""
        currentCategory="Doprava"
      />
    );
    const select = screen.getByLabelText(/Filtrovat podle stavu/i);
    fireEvent.change(select, { target: { value: 'resolved' } });
    expect(mockPush).toHaveBeenCalledWith('/reports?status=resolved&category=Doprava');
  });

  test('changing category navigates to filtered URL with page reset', () => {
    render(
      <ReportsClient
        {...DEFAULT_PROPS}
        currentPage={2}
        currentStatus="pending"
        currentCategory=""
      />
    );
    const select = screen.getByLabelText(/Filtrovat podle kategorie/i);
    fireEvent.change(select, { target: { value: 'Zeleň' } });
    expect(mockPush).toHaveBeenCalledWith('/reports?status=pending&category=Zele%C5%88');
  });

  test('clearing status filter navigates without status param', () => {
    render(<ReportsClient {...DEFAULT_PROPS} currentStatus="pending" />);
    const select = screen.getByLabelText(/Filtrovat podle stavu/i);
    fireEvent.change(select, { target: { value: '' } });
    expect(mockPush).toHaveBeenCalledWith('/reports');
  });

  // --- Pagination tests ---

  test('hides pagination bar when totalPages is 1', () => {
    render(<ReportsClient {...DEFAULT_PROPS} totalPages={1} />);
    expect(screen.queryByTestId('pagination-bar')).not.toBeInTheDocument();
  });

  test('shows pagination bar when totalPages > 1', () => {
    render(<ReportsClient {...DEFAULT_PROPS} currentPage={1} totalPages={3} />);
    expect(screen.getByTestId('pagination-bar')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  test('prev button navigates to previous page', () => {
    render(<ReportsClient {...DEFAULT_PROPS} currentPage={2} totalPages={3} />);
    fireEvent.click(screen.getByLabelText('Předchozí strana'));
    // page=1 is the default — no page param in URL
    expect(mockPush).toHaveBeenCalledWith('/reports');
  });

  test('next button navigates to next page', () => {
    render(<ReportsClient {...DEFAULT_PROPS} currentPage={2} totalPages={3} />);
    fireEvent.click(screen.getByLabelText('Další strana'));
    expect(mockPush).toHaveBeenCalledWith('/reports?page=3');
  });

  test('prev button is disabled on first page', () => {
    render(<ReportsClient {...DEFAULT_PROPS} currentPage={1} totalPages={3} />);
    expect(screen.getByLabelText('Předchozí strana')).toBeDisabled();
  });

  test('next button is disabled on last page', () => {
    render(<ReportsClient {...DEFAULT_PROPS} currentPage={3} totalPages={3} />);
    expect(screen.getByLabelText('Další strana')).toBeDisabled();
  });

  test('pagination preserves active filters in URL', () => {
    render(
      <ReportsClient
        {...DEFAULT_PROPS}
        currentPage={1}
        totalPages={5}
        currentStatus="pending"
        currentCategory="Doprava"
      />
    );
    fireEvent.click(screen.getByLabelText('Další strana'));
    expect(mockPush).toHaveBeenCalledWith('/reports?status=pending&category=Doprava&page=2');
  });
});
